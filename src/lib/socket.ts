export const SOCKET_PATH = "/socket.io";

export interface DiceRollMessage {
  uuid: string;
  name: string;
  rolls: {
    discipline: number[];
    exhaustion: number[];
    madness: number[];
    pain: number[];
  };
}

export type DiceRolls = DiceRollMessage["rolls"];

export interface ClientToServerEvents {
  send_msg: (data: DiceRollMessage) => void;
}

export interface ServerToClientEvents {
  receive_msg: (data: DiceRollMessage) => void;
}
