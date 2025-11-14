import { useState } from "react";
import Content from "./components/MessageBox/Content";
import Login from "./components/Login";

const App = () => {
  const [user, setUser] = useState<string | null>(null);

  if (!user) {
    return <Login onLogin={(username) => setUser(username)} />;
  }

  return (
    <div className="flex h-screen w-full bg-lienar-to-br from-gray-900 to-gray-800 text-white">
      <Content username={user} />
    </div>
  );
};

export default App;
