import React, { useState } from "react";
import { RawMatch } from "../../types/DPFResultInterfaces.ts";
import rankedInService from "../../services/rankedIn.ts";

interface MatchResultFormProps {
  matches: RawMatch[];
  onResultSubmitted: () => void; // Callback to refresh results after submission
}

const MatchResultForm: React.FC<MatchResultFormProps> = ({
  matches,
  onResultSubmitted,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [sets, setSets] = useState([
    { player1: "0", player2: "0" },
    { player1: "0", player2: "0" },
    { player1: "0", player2: "0" },
  ]);
  const [tiebreak, setTiebreak] = useState({ player1: "0", player2: "0" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSetChange = (
    setIndex: number,
    player: "player1" | "player2",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0 || numValue > 7) {
      setError("Set scores must be between 0 and 7.");
      return;
    }
    setError(null);
    const newSets = [...sets];
    newSets[setIndex][player] = value;
    setSets(newSets);
  };

  const handleTiebreakChange = (
    player: "player1" | "player2",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0 || numValue > 30) {
      setError("Tiebreak scores must be between 0 and 30.");
      return;
    }
    setError(null);
    setTiebreak((prev) => ({ ...prev, [player]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) {
      setError("Please select a match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = {
        matchId: selectedMatchId,
        sets: sets.map((set) => ({
          player1: set.player1,
          player2: set.player2,
        })),
        tiebreak:
          parseInt(tiebreak.player1) > 0 || parseInt(tiebreak.player2) > 0
            ? {
                player1: tiebreak.player1,
                player2: tiebreak.player2,
              }
            : undefined,
      };

      await rankedInService.saveMatchResult(result);
      onResultSubmitted(); // Refresh results
      setSets([
        { player1: "0", player2: "0" },
        { player1: "0", player2: "0" },
        { player1: "0", player2: "0" },
      ]);
      setTiebreak({ player1: "0", player2: "0" });
      setSelectedMatchId(null);
      setError(null);
      alert("Match result submitted successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to submit result.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-850 p-6 rounded-lg border border-brand-secondary">
      <h2 className="text-2xl font-bold text-brand-primary mb-4">
        Enter Match Result
      </h2>
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-2 mb-4 text-red-500">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Select Match</label>
          <select
            value={selectedMatchId || ""}
            onChange={(e) => setSelectedMatchId(parseInt(e.target.value))}
            className="w-full bg-slate-750 text-white border border-gray-700 rounded p-2"
            required
          >
            <option value="" disabled>
              Select a match
            </option>
            {matches.map((match) => (
              <option key={match.Id} value={match.Id}>
                Match {match.Id}: {match.Challenger.Name} vs{" "}
                {match.Challenged.Name}
              </option>
            ))}
          </select>
        </div>

        {sets.map((set, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-lg font-bold text-brand-secondary">
              Set {index + 1}
            </h3>
            <div className="flex space-x-4">
              <div>
                <label className="block text-gray-300 mb-1">Player 1</label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={set.player1}
                  onChange={(e) =>
                    handleSetChange(index, "player1", e.target.value)
                  }
                  className="w-20 bg-slate-750 text-white border border-gray-700 rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Player 2</label>
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={set.player2}
                  onChange={(e) =>
                    handleSetChange(index, "player2", e.target.value)
                  }
                  className="w-20 bg-slate-750 text-white border border-gray-700 rounded p-2"
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <div className="mb-4">
          <h3 className="text-lg font-bold text-brand-secondary">Tiebreak</h3>
          <div className="flex space-x-4">
            <div>
              <label className="block text-gray-300 mb-1">Player 1</label>
              <input
                type="number"
                min="0"
                max="30"
                value={tiebreak.player1}
                onChange={(e) =>
                  handleTiebreakChange("player1", e.target.value)
                }
                className="w-20 bg-slate-750 text-white border border-gray-700 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Player 2</label>
              <input
                type="number"
                min="0"
                max="30"
                value={tiebreak.player2}
                onChange={(e) =>
                  handleTiebreakChange("player2", e.target.value)
                }
                className="w-20 bg-slate-750 text-white border border-gray-700 rounded p-2"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full bg-brand-primary text-white py-2 rounded ${
            submitting
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-brand-accent"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Result"}
        </button>
      </form>
    </div>
  );
};

export default MatchResultForm;
