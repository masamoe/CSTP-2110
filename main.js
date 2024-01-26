import Amplify from 'aws-amplify';
import awsconfig from './aws-exports';
import { DynamoDB } from 'aws-sdk';
import readline from 'readline';

Amplify.configure(awsconfig);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const gameMap = [
  { id: 1, description: 'You are in a dark room. There is a door to the north.', north: 2 },
  { id: 2, description: 'You entered another room. You see a chest to the east.', east: 3 },
  { id: 3, description: 'You found a chest with a sword inside! You can go back to the west or continue north.', east: 2, north: 4 },
  { id: 4, description: 'You are in a corridor. You can go east or south.', east: 5, south: 3 },
  { id: 5, description: 'You see a monster ahead. It\'s a giant spider!', south: 4, combat: 'giant spider' },
];

let player = {
  currentRoom: 1,
  inventory: [],
  health: 100,
};

const monsters = {
  'giant spider': { name: 'Giant Spider', health: 30, damage: 10 },
  // Add more monsters as needed
};

function displayRoomDescription(roomId) {
  const room = gameMap.find((r) => r.id === roomId);
  console.log(room.description);
}

function move(direction) {
  const room = gameMap.find((r) => r.id === player.currentRoom);
  const nextRoomId = room[direction];

  if (nextRoomId) {
    player.currentRoom = nextRoomId;
    displayRoomDescription(nextRoomId);
    if (room.combat) {
      startCombat(room.combat);
    }
  } else {
    console.log('You cannot go that way.');
  }
}

async function startCombat(monsterName) {
  const monster = monsters[monsterName];
  console.log(`You are in combat with a ${monster.name}!`);

  while (player.health > 0 && monster.health > 0) {
    // Implement combat mechanics
    const playerDamage = Math.floor(Math.random() * 20); // Random player damage
    const monsterDamage = Math.floor(Math.random() * 10); // Random monster damage

    monster.health -= playerDamage;
    player.health -= monsterDamage;

    console.log(`You hit the ${monster.name} for ${playerDamage} damage.`);
    console.log(`${monster.name} hits you for ${monsterDamage} damage.`);
  }

  if (player.health <= 0) {
    console.log('You have been defeated! Game Over.');
    rl.close();
  }
  if (monster.health <= 0) {
      console.log(`You defeated the ${monster.name}!`);
      const playerName = 'JohnDoe'; // Replace with the player's actual name
      const score = 1000; // Replace with an appropriate scoring system
      await saveHighScore(playerName, score);
    }
}

async function saveHighScore(playerName, score) {
  const dynamoDB = new AWS.DynamoDB.DocumentClient();

  const params = {
    TableName: 'HighScores',
    Item: { playerName, score },
  };

  try {
    await dynamoDB.put(params).promise();
    console.log(`High score saved for ${playerName}`);
  } catch (error) {
    console.error('Error saving high score:', error);
  }
}

function processPlayerInput(input) {
  const direction = input.toLowerCase().trim();

  if (direction === 'north' || direction === 'east' || direction === 'south' || direction === 'west') {
    move(direction);
  } else if (direction === 'look around') {
    displayRoomDescription(player.currentRoom);
  } else {
    console.log("I don't understand that command.");
  }
}

displayRoomDescription(player.currentRoom);

rl.on('line', (input) => {
  processPlayerInput(input);
});

console.log('Welcome to the dungeon crawler! You can move using directions (north, east, south, west) or type "look around" to see your surroundings.');
