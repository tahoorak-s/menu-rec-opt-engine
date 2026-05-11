import { useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Select from "react-select";

function App() {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [item, setItem] = useState("");
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState(JSON.parse(localStorage.getItem("categories")) || null);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [regRole, setRegRole] = useState("waiter");

  const [pending, setPending] = useState([]);

  //registration
  const register = async () => {
    if (!username || !password) {
      alert("Enter all fields");
      return;
    }

    try {
      await axios.post("http://localhost:8000/register", null, {
        params: {
          username,
          password,
          role: regRole
        }
      });

      alert("Registered successfully!");
      setIsRegister(false);
      setUsername("");
      setPassword("");
    } catch (err) {
      alert(err.response?.data?.detail || "Registration failed");
    }
  };

  //login
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
      alert(err.response?.data?.detail || "Invalid login");
    }
  };

  //logout
  const logout = () => {
    localStorage.clear();

    setRole(null);
    setUsername("");
    setPassword("");
    setItem("");
    setResult(null);
    setPending([]);
  };

  //building the ml models
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
      const res = await axios.post(
        "http://localhost:8000/build",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setCategories(res.data.categories);
      localStorage.setItem(
        "categories",
        JSON.stringify(res.data.categories)
      );
      alert("Models Built!");
    } catch (err) {
      alert(err.response?.data?.detail || "Error building models");
    } finally {
      setLoading(false);
    }
  };

  //recommendation engine
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
      alert(err.response?.data?.detail || "Error getting recommendations");
    }
  };

  //fetch pending waiters for admin dashboard
  const fetchPending = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:8000/pending-waiters",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setPending(res.data.pending);
    } catch (err) {
      alert("Error fetching waiters");
    }
  };

  //approve the waiters, admin.
  const approve = async (username) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:8000/approve-waiter",
        null,
        {
          params: { username },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchPending();
    } catch (err) {
      alert("Error approving waiter");
    }
  };

  const quadrantData = categories
  ? Object.entries(categories).map(([key, value]) => ({
      name: key,
      value: value.length,
    }))
  : [];

  const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#F44336"];

  const itemOptions = categories
  ? Object.entries(categories).flatMap(([quadrant, items]) =>
      items.map((item) => ({
        value: item,
        label: item,
      }))
    )
  : [];

  //login/registration page
  if (!role) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h2>{isRegister ? "Register" : "Login"}</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        {isRegister && (
          <>
            <select onChange={(e) => setRegRole(e.target.value)}>
              <option value="waiter">Waiter</option>
              <option value="admin">Admin</option>
            </select>
            <br /><br />
          </>
        )}

        <button onClick={isRegister ? register : login}>
          {isRegister ? "Register" : "Login"}
        </button>

        <p
          style={{ cursor: "pointer", color: "blue" }}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? "Already have an account? Login"
            : "New user? Register"}
        </p>
      </div>
    );
  }

  //admin dashboard
  if (role === "admin") {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Admin Dashboard</h2>

        <button onClick={logout}>🚪 Logout</button>

        <hr />

        <h3>Upload Data</h3>

        <input type="file" onChange={(e) => setFile1(e.target.files[0])} />
        <br /><br />

        <input type="file" onChange={(e) => setFile2(e.target.files[0])} />
        <br /><br />

        <button onClick={build} disabled={loading}>
          {loading ? "Building..." : "Build Models"}
        </button>
        {categories && (
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginTop: "30px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >

            {/* ---------------- PIE CHART ---------------- */}

            <div
              style={{
                width: "450px",
                height: "400px",
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ textAlign: "center" }}>
                Menu Engineering Distribution
              </h3>

              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={quadrantData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    label
                  >
                    {quadrantData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ---------------- QUADRANT DROPDOWNS ---------------- */}

            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "20px",
              }}
            >
              {Object.entries(categories).map(([quadrant, items]) => (
                <div
                  key={quadrant}
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  <h3>{quadrant}</h3>

                  <details>
                    <summary
                      style={{
                        cursor: "pointer",
                        fontWeight: "bold",
                        marginBottom: "10px",
                      }}
                    >
                      View Items ({items.length})
                    </summary>

                    <div
                      style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        marginTop: "10px",
                      }}
                    >
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr />

        <h3>Pending Waiters</h3>
        <button onClick={fetchPending}>Load</button>

        {pending.map((w, i) => (
          <div key={i}>
            {w}
            <button onClick={() => approve(w)}>Approve</button>
          </div>
        ))}
      </div>
    );
  }

  //Waiter dashboard
  if (role === "waiter") {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Waiter Panel</h2>

        <button onClick={logout}>Logout</button>

        <br /><br />

        {!categories && (
          <p>⚠️ Admin must upload and build models first</p>
        )}

        <Select
            options={
              categories
                ? Object.entries(categories).flatMap(([quadrant, items]) =>
                    items.map((item) => ({
                      value: item,
                      label: item,
                    }))
                  )
                : []
            }
            onChange={(selected) => setItem(selected.value)}
            placeholder="🔍 Search and select item..."
            isSearchable={true}
          />

        <br /><br />

        <button onClick={recommend}>Recommend</button>

        {result && (
          <div>
            <h3>Results</h3>
            {result.recommendations.map((r, i) => (
              <div key={i}>{r}</div>
            ))}
            <p>{result.reason}</p>
          </div>
        )}
      </div>
    );
  }
}

export default App;