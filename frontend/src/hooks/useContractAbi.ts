import { useState, useEffect } from "react";

export function useContractAbi(contract: "TokenPrice" | "EP") {
  const [abi, setAbi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAbi = async () => {
      try {
        const response = await fetch(`/src/abi/${contract}.json`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const json = await response.json();
        console.log("JSON: ", json.abi);
        setAbi(json.abi);
      } catch (error) {
        setError("Error fetching ABI: " + error);
      } finally {
        setLoading(false);
      }
    };

    fetchAbi();
  }, []);

  return { abi, loading, error };
}
