const express = require("express");
const app = express();
const cors = require("cors");
const ytdl = require("ytdl-core");
const { chain, forEach } = require("lodash");
const ffmpegPath = require("ffmpeg-static");
const { spawn } = require("child_process");
const sanitize = require("sanitize-filename");

app.use(express.json());
app.use(cors());

const getResu = (formats) => {
  return [
    ...new Set(
      formats
        .filter((format) => format.qualityLabel !== null)
        .map((v) => v.height)
    ),
  ];
};

app.get("/api/get-video-info/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const { videoDetails, formats } = await ytdl.getInfo(videoId);
    const { title, thumbnails } = videoDetails;
    const videoResu = getResu(formats);

    res.status(200).json({
      videoInfo: {
        title,
        thumbnailUrl: thumbnails[thumbnails.length - 1].url,
        videoResu,
        lastResu: videoResu[0],
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch video details" });
  }
});

app.get("/video-download", async (req, res) => {
  try {
    const { id, resu } = req.query;
    const {
      videoDetails: { title },
      formats,
    } = await ytdl.getInfo(id);
    const videoFormat = chain(formats)
      .find({ qualityLabel: `${resu}p` })
      .value();

    const videoStream = ytdl(id, {
      quality: videoFormat.itag,
      filter: (format) => format.qualityLabel === `${resu}p`,
    });
    const audioStream = ytdl(id, { quality: "highestaudio" });

    const ffmpegProcess = spawn(
      ffmpegPath,
      [
        "-i",
        "pipe:3",
        "-i",
        "pipe:4",
        "-map",
        "0:v",
        "-map",
        "1:a",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-strict",
        "experimental",
        "-movflags",
        "frag_keyframe+empty_moov",
        "-f",
        "mp4",
        "-",
      ],
      {
        stdio: ["pipe", "pipe", "pipe", "pipe", "pipe"],
      }
    );

    videoStream.pipe(ffmpegProcess.stdio[3]);
    audioStream.pipe(ffmpegProcess.stdio[4]);

    ffmpegProcess.stdio[1].on("data", (chunk) => res.write(chunk));
    ffmpegProcess.stdio[2].on("data", (chunk) =>
      console.error(chunk.toString())
    );

    ffmpegProcess.on("exit", () => {
      res.end();
    });

    const filename = `${encodeURI(sanitize(title))}.mp4`;

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment;filename=${filename};filename*=uft-8''${filename}`
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to download video" });
  }
});

const port = 3001;
app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Server is running on port ${port}!`));
