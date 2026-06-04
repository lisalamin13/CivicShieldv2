/**
 * Resolves the full URL for media and avatar uploads, supporting custom backend base URLs
 * and falling back to relative paths for same-origin or Vite proxy setups.
 * 
 * @param {string} path - The relative media path (e.g. '/uploads/filename.jpg')
 * @returns {string} The resolved image URL
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const base = apiUrl.replace(/\/api\/?$/, '');
    return `${base}${path}`;
  }
  return path; // relative path: e.g. /uploads/...
};
