import { Injectable } from '@nestjs/common';
import { User, Room, SocketResponse } from 'src/types';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway(5555, { cors: { origin: '*' } })
export class CallService {
  @WebSocketServer()
  private readonly server: Server;
  private rooms: Map<string, Room> = new Map(); // Oda veri yapısı
  constructor(
      @InjectQueue('availableUsersQueue')
      private availableUsersQueue: Queue<User>,
      @InjectQueue('callQueue') private callQueue: Queue<Room>,
  ) {}

  private async initRoom(
      currentUser: User,
      availableUser: User,
  ): Promise<Room> {
    const roomId = uuidv4().substring(0, 5);
    const room: Room = {
      roomId,
      availableUser,
      currentUser,
      roomURL: `/room?roomID=${roomId}`,
    };

    this.rooms.set(roomId, room); // Odayı odalar haritasına ekleyin

    await this.callQueue.add(room);

    return room;
  }


  private async findAvailableUser(): Promise<User | null> {
    const isUserAvailable: number = await this.availableUsersQueue.count();
    if (!isUserAvailable) return null;

    const { data } = await this.availableUsersQueue.getNextJob();
    return data;
  }

  private async unregisterAvailableUser(user: User): Promise<void> {
    await this.availableUsersQueue.removeJobs(user.id);
  }

  private async registerAvailableUser(user: User): Promise<void> {
    await this.availableUsersQueue.add(user, { jobId: user.id });
  }

  @SubscribeMessage('events')
  public async matchMaking(
      @MessageBody() data: { peerId: string },
      @ConnectedSocket() client: Socket,
  ): Promise<any> {
    console.log('NEW WEBSOCKET REQUEST WAS RECEIVED');

    const id = uuidv4().substring(0, 5);
    const currentUser: User = { id, socketId: client.id, peerId: data.peerId };

    const availableUser: User = await this.findAvailableUser();

    if (!availableUser) {
      await this.registerAvailableUser(currentUser);

      const socketResponse: SocketResponse = {
        isUserFound: false,
        message: 'No user was found. You are now on queue.',
        room: null,
      };
      client.emit('events', socketResponse);
      return 0;
    }

    const room = await this.initRoom(currentUser, availableUser);

    const socketResponse: SocketResponse = {
      isUserFound: true,
      message: 'An available user was found.',
      room,
      peerId: availableUser.peerId,
    };

    await this.unregisterAvailableUser(availableUser);

    const socket = this.server.sockets.sockets.get(availableUser.socketId);
    if (!socket) return console.log('Socket not connected');

    socket.emit('call', socketResponse as any);
    client.emit('events', socketResponse);
    return 0;
  }

  @SubscribeMessage('chatMessage')
  public handleChatMessage(
      @MessageBody() data: { roomId: string, message: string },
      @ConnectedSocket() client: Socket,
  ) {
    console.log('Received chat message:', data);
    const room = this.rooms.get(data.roomId);
    if (room) {
      this.server.to(room.roomId).emit('chatMessage', data.message);
    }
  }
  @SubscribeMessage('sendMessage')
  public handleMessage(
      @MessageBody() data: { roomId: string, message: string },
      @ConnectedSocket() client: Socket,
  ) {
    console.log('Received send message:', data.message);
    const room = this.rooms.get(data.roomId);
    if (room) {
      this.server.to(room.roomId).emit('receiveMessage', {
        message: data.message,
        from: client.id,
      });
    }
  }
}
