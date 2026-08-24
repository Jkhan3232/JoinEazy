import { startTransition, useEffect, useState } from "react";

import { getErrorMessage } from "../utils/format";

export const useAsyncData = (loader, deps = [], initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await loader();

        if (!ignore) {
          startTransition(() => {
            setData(result);
          });
        }
      } catch (err) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      ignore = true;
    };
  }, deps);

  const reload = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await loader();
      startTransition(() => {
        setData(result);
      });
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    setData,
    loading,
    error,
    reload,
  };
};
