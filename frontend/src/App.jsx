import { useState } from "react";
import axios from "axios";

function App() {
  const [role, setRole] = useState(null);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [item, setItem] = useState("");
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState(null); // 🔥 new
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  
  const login = async () => {


  if (!username || !password) {
    alert("Enter username and password");
    return;
  }

  try {
    const res = await axios.post("http://localhost:8000/login", null, {
      params: { username, password }
    });

    localStorage.setItem("token", res.data.access_token);
    localStorage.setItem("role", res.data.role);

    setRole(res.data.role);
  } catch (err) {
    alert("Invalid login");
  }
};

  // -----------------------------
  // BUILD MODELS
  // -----------------------------
  const build = async () => {
    if (!file1 || !file2) {
      alert("Upload both files first");
      return;
    }

    const formData = new FormData();
    formData.append("transactions", file1);
    formData.append("items", file2);

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.post("http://localhost:8000/build", formData, {
                  headers: {
                      Authorization: `Bearer ${token}`
                  }
                });

      setCategories(res.data.categories);
      alert("Models Built!");
    } catch (err) {
      alert("Error building models");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // RECOMMEND
  // -----------------------------
  const recommend = async () => {
    if (!item) {
      alert("Enter an item");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:8000/recommend?item=${item}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setResult(res.data);
    } catch (err) {
      alert("Error getting recommendations");
      console.log(err);
    }
  };

  const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  setRole(null);
  setUsername("");
  setPassword("");
  setItem(""); 
};


  // -----------------------------
  // ROLE SELECTION
  // -----------------------------
  if (!role) {
  return (
    <div>
      <h2>Login</h2>

      <input
        placeholder="Username"
        value = {username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value = {password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={login}>Login</button>
    </div>
  );
}

  // -----------------------------
  // ADMIN DASHBOARD
  // -----------------------------
  if (role === "admin") {
    return (
      <div style={{ padding: "30px" }}>
        <h2>👨‍💼 Admin Dashboard</h2>

        <h3>Upload Data</h3>

        <input type="file" onChange={(e) => setFile1(e.target.files[0])} />
        <br /><br />

        <input type="file" onChange={(e) => setFile2(e.target.files[0])} />
        <br /><br />

        <button onClick={build} disabled={loading}>
          ⚙️ {loading ? "Building..." : "Build Models"}
        </button>

        {loading && <p>⏳ Building models...</p>}

        {/* 🔥 CATEGORY DISPLAY */}
        {categories && (
          <div style={{ marginTop: "30px" }}>
            <h3>📊 Menu Engineering Results</h3>

            {Object.entries(categories).map(([type, items]) => (
              <div key={type} style={{ marginBottom: "20px" }}>
                <h4>
                  {type === "STAR" && "⭐ STAR"}
                  {type === "PLOWHORSE" && "🐎 PLOWHORSE"}
                  {type === "PUZZLE" && "🧩 PUZZLE"}
                  {type === "DOG" && "🐶 DOG"}
                </h4>

                {items.length === 0 ? (
                  <p>No items</p>
                ) : (
                  items.map((item, i) => (
                    <div key={i}>{item}</div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}

        <br />
        <button onClick={logout}>
          🚪 Logout
        </button>
      </div>
    );
  }

  // -----------------------------
  // WAITER PANEL
  // -----------------------------
  if (role === "waiter") {
    return (
      <div style={{ padding: "30px" }}>
        <h2>👨‍🍳 Waiter Panel</h2>

        <input
          type="text"
          placeholder="Enter item"
          value = {item}
          onChange={(e) => setItem(e.target.value)}
        />

        <br /><br />

        <button onClick={recommend}>
          Recommend
        </button>

        {result && (
          <div style={{ marginTop: "20px" }}>
            <h3>🍽 Recommendations</h3>

            {result.recommendations.map((r, i) => (
              <div key={i}>{r}</div>
            ))}

            <p style={{ marginTop: "10px" }}>
              <b>{result.reason}</b>
            </p>
          </div>
        )}

        <br />
        <button onClick={logout}>
          🚪 Logout
        </button>
      </div>
    );
  }
}

export default App;