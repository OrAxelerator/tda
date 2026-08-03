import http from "node:http";

const port = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  if (req.url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "test-card-backend",
      }),
    );
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Backend Render OK");
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
