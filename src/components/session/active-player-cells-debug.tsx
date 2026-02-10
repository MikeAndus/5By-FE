import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CellSnapshot, PlayerSnapshot } from "@/lib/api/session-snapshot";

interface ActivePlayerCellsDebugProps {
  activePlayer: PlayerSnapshot | null;
}

const sortCellsByIndex = (cells: CellSnapshot[]): CellSnapshot[] => {
  return cells.slice().sort((a, b) => a.index - b.index);
};

const formatTopicsUsed = (topics: string[]): string => {
  if (topics.length === 0) {
    return "—";
  }

  return topics.join(", ");
};

export const ActivePlayerCellsDebug = ({
  activePlayer,
}: ActivePlayerCellsDebugProps): JSX.Element => {
  if (!activePlayer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Player Cells</CardTitle>
          <CardDescription>
            Debug view is unavailable because no active player matched current_turn.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const orderedCells = sortCellsByIndex(activePlayer.cells);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Player Cells</CardTitle>
        <CardDescription>
          Developer-facing list for Player {activePlayer.player_number}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orderedCells.length === 0 ? (
          <p className="text-sm text-brand-accentBlue">
            No cell states seeded yet for this player.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-brand-accentLavender">
                  <th className="px-2 py-2">Index</th>
                  <th className="px-2 py-2">Row</th>
                  <th className="px-2 py-2">Col</th>
                  <th className="px-2 py-2">Revealed</th>
                  <th className="px-2 py-2">Locked</th>
                  <th className="px-2 py-2">Letter</th>
                  <th className="px-2 py-2">Topics Used</th>
                  <th className="px-2 py-2">Revealed By</th>
                </tr>
              </thead>
              <tbody>
                {orderedCells.map((cell) => (
                  <tr className="border-b border-brand-accentLavender/70" key={cell.index}>
                    <td className="px-2 py-2 font-mono">{cell.index}</td>
                    <td className="px-2 py-2">{cell.row}</td>
                    <td className="px-2 py-2">{cell.col}</td>
                    <td className="px-2 py-2">{String(cell.revealed)}</td>
                    <td className="px-2 py-2">{String(cell.locked)}</td>
                    <td className="px-2 py-2">{cell.letter ?? "—"}</td>
                    <td className="px-2 py-2">{formatTopicsUsed(cell.topics_used)}</td>
                    <td className="px-2 py-2">{cell.revealed_by ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
