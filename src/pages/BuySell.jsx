import React, { useEffect, useState } from "react";
import { fetchItems, createItem } from "../api/items";
// src/pages/BuySell.jsx
import ConnectWallet from "../components/ConnectWallet.jsx";
import BuySellUI from "../sections/BuySellUI";
import DexScreenerChart from "../components/DexScreenerChart.jsx";

const BuySell = () => {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemImage, setNewItemImage] = useState(null);

  // Fetch all items when the component loads
  useEffect(() => {
    fetchItems()
      .then(setItems)
      .catch(console.error);
  }, []);

  // Handle form submission for new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemImage) return;

    try {
      const savedItem = await createItem(newItemName, newItemImage);
      setItems((prev) => [...prev, savedItem]);
      setNewItemName("");
      setNewItemImage(null);
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    setNewItemImage(e.target.files[0]);
  };

  return (
    <div>
      <h2>Buy/Sell Items</h2>

      <form onSubmit={handleAddItem}>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Enter item name"
        />
        <input type="file" onChange={handleImageChange} />
        <button type="submit">Add Item</button>
      </form>

      <ul>
        {items.map((item) => (
          <li key={item._id}>
            {item.name}{" "}
            {item.image && (
              <img
                src={`http://localhost:5001/uploads/${item.image}`}
                alt={item.name}
                style={{ width: "100px", height: "100px" }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BuySell;
