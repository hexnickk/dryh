import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { DiceRollMessage, DiceRolls } from "@/lib/socket";

type ResultCardProps = Pick<DiceRollMessage, "name" | "rolls">;

const DOMINANCE_HIERARCHY: Array<keyof DiceRolls> = [
  "discipline",
  "madness",
  "exhaustion",
  "pain",
];

const DICE_LABELS: Record<keyof DiceRolls, string> = {
  discipline: "Дисциплина",
  madness: "Безумие",
  exhaustion: "Истощение",
  pain: "Боль",
};

const ResultCard = ({ name, rolls }: ResultCardProps) => {
  const playerSuccesses = [
    ...rolls.discipline,
    ...rolls.exhaustion,
    ...rolls.madness,
  ].filter((die) => die <= 3).length;

  const masterSuccesses = rolls.pain.filter((die) => die <= 3).length;

  const calculateDominant = (): keyof DiceRolls => {
    const entries = DOMINANCE_HIERARCHY.map((key) => [key, rolls[key]] as const);

    entries.sort((a, b) => {
      const [keyA, rollsA] = a;
      const [keyB, rollsB] = b;

      const maxA = Math.max(...rollsA, 0);
      const maxB = Math.max(...rollsB, 0);

      if (maxA !== maxB) return maxB - maxA;

      const countA = rollsA.filter((roll) => roll === maxA).length;
      const countB = rollsB.filter((roll) => roll === maxB).length;

      if (countA !== countB) return countB - countA;

      const sortedA = [...rollsA].sort((x, y) => y - x);
      const sortedB = [...rollsB].sort((x, y) => y - x);

      for (let i = 0; i < Math.max(sortedA.length, sortedB.length); i++) {
        if (sortedA[i] !== sortedB[i])
          return (sortedB[i] || 0) - (sortedA[i] || 0);
      }

      return DOMINANCE_HIERARCHY.indexOf(keyA) - DOMINANCE_HIERARCHY.indexOf(keyB);
    });

    return entries[0][0];
  };

  const dominant = calculateDominant();

  return (
    <Card className="bg-muted">
      <CardHeader>
        <CardTitle className="text-xl">Результаты</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <div>Имя игрока: {name}</div>
        </div>
        <div>
          <div>Успехи Игрока: {playerSuccesses}</div>
          <div>Успехи Мастера: {masterSuccesses}</div>
        </div>
        <div>
          <strong>Доминанта:</strong> {DICE_LABELS[dominant]}
        </div>
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Значения кубиков:</h4>
          {DOMINANCE_HIERARCHY.map((key) => {
            const rollValues = rolls[key];

            return (
              <div key={key} className="flex items-center space-x-2">
                <span className="font-medium">{DICE_LABELS[key]}:</span>
                <div className="flex flex-wrap gap-1">
                  {rollValues.map((roll, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold ${
                        roll <= 3
                          ? "bg-orange-700 text-white"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {roll}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
