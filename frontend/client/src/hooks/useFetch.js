import { useState, useEffect, useCallback } from "react";
import axios from "axios";

/**
 * useFetch - Custom hook gọi API có quản lý trạng thái
 * @param {string} url - endpoint API cần gọi
 * @param {object} options - tùy chọn axios (method, headers, params,...)
 * @returns {object} { data, loading, error, refetch }
 */
export default function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios({
        url,
        method: options.method || "GET",
        ...options,
      });
      setData(res.data);
    } catch (err) {
      console.error(" useFetch error:", err);
      setError(err.response?.data?.message || err.message || "Lỗi không xác định khi gọi API");
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
