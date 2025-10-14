const API_URL = "http://localhost:5001/api/items"; // Update if deployed

export const fetchItems = async () => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Failed to fetch items");
  return await res.json();
};

export const createItem = async (name, image) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('image', image);

  const res = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to create item");
  return await res.json();
};
