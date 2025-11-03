// src/contexts/AppContext.jsx
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const showNotification = (message, type = "info") => {
    setNotifications((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  return <AppContext.Provider value={{ notifications, showNotification, loading, setLoading }}>{children}</AppContext.Provider>;
};
