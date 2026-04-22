"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dice1Icon as Dice, Plus } from "lucide-react";
import ResultCard from "@/components/resultCard";
import { nanoid } from "nanoid";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { io, type Socket } from "socket.io-client";

import {
  SOCKET_PATH,
  type ClientToServerEvents,
  type DiceRollMessage,
  type ServerToClientEvents,
} from "@/lib/socket";

interface Player {
  id: string;
  name: string;
  discipline: number;
  exhaustion: number;
  madness: number;
  pain: number;
  exhaustionSkill: string;
  madnessSkill: string;
  bei: boolean[];
  begi: boolean[];
}

type NumericPlayerField = "discipline" | "madness" | "exhaustion" | "pain";
type CheckboxPlayerField = "bei" | "begi";

const PRIMARY_DICE_FIELDS: Array<{ label: string; field: NumericPlayerField }> = [
  { label: "Дисциплина", field: "discipline" },
  { label: "Безумие", field: "madness" },
];

const SECONDARY_DICE_FIELDS: Array<{
  label: string;
  field: NumericPlayerField;
}> = [
  { label: "Истощение", field: "exhaustion" },
  { label: "Боль", field: "pain" },
];

const parseDiceCount = (value: string) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? 0 : Math.max(0, parsedValue);
};

const createPlayer = (id: string): Player => ({
  id,
  name: "",
  discipline: 0,
  exhaustion: 0,
  madness: 0,
  pain: 0,
  exhaustionSkill: "",
  madnessSkill: "",
  bei: [false, false, false],
  begi: [false, false, false],
});

const DiceRollCalculator = () => {
  const [players, setPlayers] = useState<Player[]>(() => [createPlayer("player-1")]);
  const [chat, setChat] = useState<DiceRollMessage[]>([]);
  const socketRef = useRef<
    Socket<ServerToClientEvents, ClientToServerEvents> | null
  >(null);
  const nextPlayerIdRef = useRef(2);

  const appendMessage = useCallback((message: DiceRollMessage) => {
    setChat((previous) =>
      previous.some((currentMessage) => currentMessage.uuid === message.uuid)
        ? previous
        : [...previous, message]
    );
  }, []);

  useEffect(() => {
    const socket = io({
      path: SOCKET_PATH,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("receive_msg", (data) => {
      appendMessage(data);
    });

    return () => {
      socket.off("receive_msg");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [appendMessage]);

  const rollDice = (numDice: number) =>
    Array.from({ length: numDice }, () => Math.ceil(Math.random() * 6)).sort(
      (a, b) => b - a
    );

  const addPlayer = () => {
    const nextPlayerId = `player-${nextPlayerIdRef.current++}`;
    setPlayers((currentPlayers) => [...currentPlayers, createPlayer(nextPlayerId)]);
  };

  const updatePlayer = <K extends keyof Player>(
    id: string,
    field: K,
    value: Player[K]
  ) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === id ? { ...player, [field]: value } : player
      )
    );
  };

  const updatePlayerCheckbox = (
    id: string,
    field: CheckboxPlayerField,
    index: number,
    checked: boolean
  ) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => {
        if (player.id !== id) return player;

        return {
          ...player,
          [field]: player[field].map((value, currentIndex) =>
            currentIndex === index ? checked : value
          ),
        };
      })
    );
  };

  const calculate = (playerId: string) => {
    const player = players.find((currentPlayer) => currentPlayer.id === playerId);
    if (!player) return;

    const message = {
      uuid: nanoid(),
      name: player.name,
      rolls: {
        discipline: rollDice(player.discipline),
        madness: rollDice(player.madness),
        exhaustion: rollDice(player.exhaustion),
        pain: rollDice(player.pain),
      },
    } satisfies DiceRollMessage;

    appendMessage(message);
    socketRef.current?.emit("send_msg", message);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Don&apos;t Rest Your Head - Dice Roller
          </h1>
          <Button onClick={addPlayer} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                {players.map((player) => {
                  const nameInputId = `name-${player.id}`;
                  const exhaustionSkillInputId = `exhaustion-skill-${player.id}`;
                  const madnessSkillInputId = `madness-skill-${player.id}`;

                  return (
                    <Card key={player.id} className="p-3">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={nameInputId} className="text-sm">
                            Имя игрока
                          </Label>
                          <Input
                            id={nameInputId}
                            type="text"
                            value={player.name}
                            onChange={(e) =>
                              updatePlayer(player.id, "name", e.target.value)
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={exhaustionSkillInputId} className="text-sm">
                            Навык истощения
                          </Label>
                          <Textarea
                            id={exhaustionSkillInputId}
                            value={player.exhaustionSkill}
                            onChange={(e) =>
                              updatePlayer(
                                player.id,
                                "exhaustionSkill",
                                e.target.value
                              )
                            }
                            className="min-h-[40px] h-10 resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <Label htmlFor={madnessSkillInputId} className="text-sm">
                            Навык Безумия
                          </Label>
                          <Textarea
                            id={madnessSkillInputId}
                            value={player.madnessSkill}
                            onChange={(e) =>
                              updatePlayer(player.id, "madnessSkill", e.target.value)
                            }
                            className="min-h-[40px] h-10 resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <span className="text-sm font-medium leading-none">Бей</span>
                          <div className="flex flex-row gap-2" role="group" aria-label="Бей">
                            {player.bei.map((checked, idx) => (
                              <Checkbox
                                key={`${player.id}-bei-${idx}`}
                                aria-label={`Бей ${idx + 1}`}
                                checked={checked}
                                onCheckedChange={(nextChecked) =>
                                  updatePlayerCheckbox(
                                    player.id,
                                    "bei",
                                    idx,
                                    nextChecked === true
                                  )
                                }
                                className="h-4 w-4"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                          <span className="text-sm font-medium leading-none">Беги</span>
                          <div className="flex flex-row gap-2" role="group" aria-label="Беги">
                            {player.begi.map((checked, idx) => (
                              <Checkbox
                                key={`${player.id}-begi-${idx}`}
                                aria-label={`Беги ${idx + 1}`}
                                checked={checked}
                                onCheckedChange={(nextChecked) =>
                                  updatePlayerCheckbox(
                                    player.id,
                                    "begi",
                                    idx,
                                    nextChecked === true
                                  )
                                }
                                className="h-4 w-4"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {PRIMARY_DICE_FIELDS.map(({ label, field }) => {
                            const inputId = `${field}-dice-${player.id}`;

                            return (
                              <div key={label} className="flex items-center gap-1">
                                <Label htmlFor={inputId} className="text-xs">
                                  {label}
                                </Label>
                                <Input
                                  id={inputId}
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={player[field]}
                                  onChange={(e) =>
                                    updatePlayer(
                                      player.id,
                                      field,
                                      parseDiceCount(e.target.value)
                                    )
                                  }
                                  className="h-7 w-16"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {SECONDARY_DICE_FIELDS.map(({ label, field }) => {
                            const inputId = `${field}-dice-${player.id}`;

                            return (
                              <div key={label} className="flex items-center gap-1">
                                <Label htmlFor={inputId} className="text-xs">
                                  {label}
                                </Label>
                                <Input
                                  id={inputId}
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={player[field]}
                                  onChange={(e) =>
                                    updatePlayer(
                                      player.id,
                                      field,
                                      parseDiceCount(e.target.value)
                                    )
                                  }
                                  className="h-7 w-16"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-center pt-2">
                          <Button
                            onClick={() => calculate(player.id)}
                            size="sm"
                            className="w-full"
                          >
                            <Dice className="mr-2 h-4 w-4" />
                            Roll Dice
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex flex-col gap-3">
                {chat
                  .slice()
                  .reverse()
                  .map((message) => (
                    <ResultCard
                      key={message.uuid}
                      name={message.name}
                      rolls={message.rolls}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceRollCalculator;
