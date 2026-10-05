export interface ClientUploadOptions {
  folder?: string;
  resourceType?: "video" | "image";
  onProgress?: (percent: number) => void;
}

export interface ClientUploadResult {
  secure_url: string;
  public_id?: string;
  format?: string;
  duration?: number;
}

/**
 * Direct client-to-Cloudinary upload helper.
 * Completely bypasses Vercel's 4.5MB Serverless Function payload limit
 * and execution timeouts by uploading directly to Cloudinary's global CDN API.
 */
export async function uploadDirectToCloudinary(
  file: File | Blob,
  options: ClientUploadOptions = {}
): Promise<ClientUploadResult> {
  const folder = options.folder || "dnora/seenonyou";
  const resourceType =
    options.resourceType || (file.type && file.type.startsWith("video") ? "video" : "image");
  const fileName = file instanceof File ? file.name : `asset-${Date.now()}.png`;

  // Step 1: Request signed upload token from our lightweight server endpoint (~100 bytes)
  try {
    const signRes = await fetch("/api/media/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder, resource_type: resourceType }),
    });

    if (signRes.ok) {
      const signData = await signRes.json();
      if (signData.signature && signData.apiKey && signData.cloudName) {
        // Step 2: Upload directly to Cloudinary CDN with live progress tracking
        return await new Promise<ClientUploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const endpoint = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`;
          xhr.open("POST", endpoint);

          const fd = new FormData();
          fd.append("file", file, fileName);
          fd.append("api_key", signData.apiKey);
          fd.append("timestamp", String(signData.timestamp));
          fd.append("signature", signData.signature);
          fd.append("folder", signData.folder);

          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable && options.onProgress) {
              const percent = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
              options.onProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const resp = JSON.parse(xhr.responseText);
                if (resp.secure_url) {
                  if (options.onProgress) options.onProgress(100);
                  return resolve({
                    secure_url: resp.secure_url,
                    public_id: resp.public_id,
                    format: resp.format,
                    duration: resp.duration,
                  });
                }
              } catch {
                // fall through to error handling
              }
            }
            let err = "Cloudinary upload failed";
            try {
              const errObj = JSON.parse(xhr.responseText);
              err = errObj.error?.message || errObj.message || err;
            } catch {}
            reject(new Error(err));
          };

          xhr.onerror = () =>
            reject(new Error("Network connection error uploading directly to Cloudinary"));

          xhr.send(fd);
        });
      }
    }
  } catch (directErr) {
    console.warn("Direct Cloudinary upload failed, falling back to /api/upload:", directErr);
  }

  // Step 3: Seamless fallback to /api/upload if direct upload signature fails
  return await new Promise<ClientUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    const fd = new FormData();
    fd.append("file", file, fileName);
    fd.append("folder", folder);
    fd.append("resource_type", resourceType);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && options.onProgress) {
        const percent = Math.min(95, Math.round((evt.loaded / evt.total) * 100));
        options.onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resp = JSON.parse(xhr.responseText);
          const url = resp.secure_url || resp.url || resp.media?.secure_url;
          if (url) {
            if (options.onProgress) options.onProgress(100);
            return resolve({ secure_url: url });
          }
        } catch {}
      }
      let err = "Server upload fallback failed";
      try {
        const errObj = JSON.parse(xhr.responseText);
        err = errObj.error || err;
      } catch {}
      reject(new Error(err));
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}
