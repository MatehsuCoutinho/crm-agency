const { io } = require("socket.io-client");

const socket = io("http://localhost:4000", {
  auth: {
    token: "SEU_TOKEN_AQUI"
  }
});

socket.emit("join_ticket", "TICKET_ID_AQUI");

socket.emit("send_message", {
  ticketId: "TICKET_ID_AQUI",
  content: "Teste realtime"
});

socket.on("receive_message", (msg) => {
  console.log("Nova mensagem:", msg);
});