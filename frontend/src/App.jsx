import { useState } from "react";
import axios from "axios";

function App() {
  const [role, setRole] = useState(null);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [item, setItem] = useState("");
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState(null);
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
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    setRole(null);
    setUsername("");
    setPassword("");
    setItem("");
    setCategories(null);
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
          <div>
            <h3>Menu Engineering Quadrant Analysis</h3>
            {Object.entries(categories).map(([k, v]) => (
              <div key={k}>
                <b>{k}</b>: {v.join(", ")}
              </div>
            ))}
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

        <input
          placeholder="Enter item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
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

export default App;cd