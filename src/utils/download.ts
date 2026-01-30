export function saveAs(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // 释放内存
  URL.revokeObjectURL(url);
}

// 支持直接下载 URL
export function downloadByUrl(url: string, fileName?: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || '';
  link.click();
}