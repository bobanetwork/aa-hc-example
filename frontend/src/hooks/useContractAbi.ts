import { useState, useEffect } from "react";

/**
 * This hook fetches the ABI of a specified contract from a JSON file located in the `src/abi/` directory.
 *
 * @param {"TokenPrice"} contract - The name of the contract for which to fetch the ABI.
 * @returns {object} - An object containing the ABI array, a loading boolean, and an error message (if any).
 */
export function useContractAbi(contract: "TokenPrice") {
  const [abi, setAbi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAbi = async () => {
      try {
        const response = await fetch(`/abi/${contract}.json`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const json = await response.json();
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
