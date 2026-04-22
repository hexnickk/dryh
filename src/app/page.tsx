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

const createPlayer = (): Player => ({
  id: nanoid(),
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
  const [players, setPlayers] = useState<Player[]>([createPlayer()]);
  const [chat, setChat] = useState<DiceRollMessage[]>([]);
  const socketRef = useRef<
    Socket<ServerToClientEvents, ClientToServerEvents> | null
  >(null);

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
    setPlayers((currentPlayers) => [...currentPlayers, createPlayer()]);
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
                {players.map((player) => (
                  <Card key={player.id} className="p-3">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 items-center gap-2">
                        <Label htmlFor={`name-${player.id}`} className="text-sm">Имя игрока</Label>
                        <Input
                          id={`name-${player.id}`}
                          value={player.name}
                          onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="grid grid-cols-2 items-center gap-2">
                        <Label htmlFor={`exhaustion-${player.id}`} className="text-sm">Навык истощения</Label>
                        <Textarea
                          id={`exhaustion-${player.id}`}
                          value={player.exhaustionSkill}
                          onChange={(e) => updatePlayer(player.id, 'exhaustionSkill', e.target.value)}
                          className="min-h-[40px] h-10 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 items-center gap-2">
                        <Label htmlFor={`madness-${player.id}`} className="text-sm">Навык Безумия</Label>
                        <Textarea
                          id={`madness-${player.id}`}
                          value={player.madnessSkill}
                          onChange={(e) => updatePlayer(player.id, 'madnessSkill', e.target.value)}
                          className="min-h-[40px] h-10 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 items-center gap-2">
                        <Label htmlFor={`bei-${player.id}`} className="text-sm">Бей</Label>
                        <div className="flex flex-row gap-2">
                          {player.bei.map((checked, idx) => (
                            <Checkbox
                              key={idx}
                              checked={checked}
                              onCheckedChange={(checked) => {
                                const newBei = [...player.bei];
                                newBei[idx] = checked === true;
                                updatePlayer(player.id, 'bei', newBei);
                              }}
                              className="h-4 w-4"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 items-center gap-2">
                        <Label htmlFor={`begi-${player.id}`} className="text-sm">Беги</Label>
                        <div className="flex flex-row gap-2">
                          {player.begi.map((checked, idx) => (
                            <Checkbox
                              key={idx}
                              checked={checked}
                              onCheckedChange={(checked) => {
                                const newBegi = [...player.begi];
                                newBegi[idx] = checked === true;
                                updatePlayer(player.id, 'begi', newBegi);
                              }}
                              className="h-4 w-4"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Дисциплина", field: "discipline" as keyof Player },
                          { label: "Безумие", field: "madness" as keyof Player },
                        ].map(({ label, field }) => (
                          <div key={label} className="flex items-center gap-1">
                            <Label htmlFor={`${field}-${player.id}`} className="text-xs">
                              {label}
                            </Label>
                            <Input
                              id={`${field}-${player.id}`}
                              type="number"
                              value={player[field] as number}
                              onChange={(e) => updatePlayer(player.id, field, Math.max(0, +e.target.value))}
                              className="h-7 w-16"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Истощение", field: "exhaustion" as keyof Player },
                          { label: "Боль", field: "pain" as keyof Player },
                        ].map(({ label, field }) => (
                          <div key={label} className="flex items-center gap-1">
                            <Label htmlFor={`${field}-${player.id}`} className="text-xs">
                              {label}
                            </Label>
                            <Input
                              id={`${field}-${player.id}`}
                              type="number"
                              value={player[field] as number}
                              onChange={(e) => updatePlayer(player.id, field, Math.max(0, +e.target.value))}
                              className="h-7 w-16"
                            />
                          </div>
                        ))}
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
                ))}
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
