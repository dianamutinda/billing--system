const PORTAL_SLUG = import.meta.env.VITE_PORTAL_SLUG;

export async function getPackages() {
  const response = await fetch(`http://localhost:3000/api/packages/${PORTAL_SLUG}`);
  if (!response.ok) throw new Error('Could not load packages');
  return response.json();
}