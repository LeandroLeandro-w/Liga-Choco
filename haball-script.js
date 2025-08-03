// ⚠️ Esto debe correr en un entorno donde se permita cargar Firebase desde CDN como un script externo
var room = HBInit({
	roomName: "Sala con Login Discord",
	maxPlayers: 16,
	noPlayer: true
});

room.setDefaultStadium("Big");
room.setScoreLimit(5);
room.setTimeLimit(0);

// Cargar Firebase desde CDN (esto no se pone aquí, se espera que esté en el entorno global)
// Por eso tenés que **crear un HTML que cargue Firebase y el script de Haxball junto**

// ================== Autenticación ==================
const authorizedPlayers = {};

room.onPlayerJoin = function(player) {
  room.sendAnnouncement(`👋 ¡Hola ${player.name}! Para hablar debes loguearte con Discord. Escribí !login`, player.id, 0x00FF00);
};

room.onPlayerChat = function(player, message) {
  if (!authorizedPlayers[player.id]) {
    room.sendAnnouncement("🚫 Debes loguearte con Discord para hablar. Escribí !login", player.id, 0xFF0000);
    return false;
  }
  return true;
};

room.onPlayerLeave = function(player) {
  delete authorizedPlayers[player.id];
};

room.onPlayerChatCommand = function(player, message) {
  if (message === "!login") {
    const authId = `${player.id}_${Date.now()}`;
    const loginUrl = `https://leandroleandro-w.github.io/Liga-Choco/login.html?authId=${authId}`;
    room.sendAnnouncement(`🔗 Logueate con Discord aquí: ${loginUrl}`, player.id, 0x00bfff);

    const db = firebase.database();
    const ref = db.ref("auth/" + authId);

    const interval = setInterval(() => {
      ref.once("value", function(snapshot) {
        const data = snapshot.val();
        if (data && data.discordId) {
          authorizedPlayers[player.id] = true;
          room.sendAnnouncement(`✅ Autenticado como ${data.discordTag}. Ya podés hablar.`, player.id, 0x00FF00);
          ref.remove(); // Limpiamos
          clearInterval(interval); // Dejamos de verificar
        }
      });
    }, 2000); // Chequea cada 2 segundos
  }
};
