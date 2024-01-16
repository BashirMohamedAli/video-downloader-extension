import React, { useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import axios from "axios";

const Download = () => {
  const [link, setLink] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [resu, setResu] = useState("");
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState(null);

  const getVideoDetails = async (e) => {
    e.preventDefault();
    const videoId = link.split("https://youtu.be/")[1];

    try {
      setLoader(true);
      setError(null);
      const { data } = await axios.get(
        `http://localhost:3001/api/get-video-info/${videoId}`
      );
      setLoader(false);
      setVideoInfo(data.videoInfo);
      setResu(data.videoInfo.lastResu);
    } catch (error) {
      console.error(error.response);
      setLoader(false);
      setError(
        "Failed to fetch video details. Please check the provided link."
      );
    }
  };

  const videoDownload = () => {
    const videoId = link.split("https://youtu.be/")[1];
    const url = `http://localhost:3001/video-download?id=${videoId}&resu=${resu}`;

    // Attempt to start the download in a new window
    try {
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      setError("Failed to initiate the download. Please try again.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="w-[400px] bg-white p-8 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          YouTube Video Downloader
        </h2>
        <form onSubmit={getVideoDetails} className="mb-6">
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <input
              onChange={(e) => setLink(e.target.value)}
              className="w-full text-gray-800 px-4 py-2 focus:outline-none"
              type="text"
              placeholder="Paste YouTube video link here"
              required
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2">
              Search
            </button>
          </div>
        </form>

        {loader ? (
          <div className="w-full py-5 text-center">
            <BounceLoader color="#3498db" />
          </div>
        ) : videoInfo ? (
          <div className="flex gap-4">
            <img
              className="max-w-[150px] rounded-md h-[100px]"
              src={videoInfo.thumbnailUrl}
              alt=""
            />
            <div className="text-gray-800 flex flex-col">
              <h3 className="text-lg font-semibold">
                {videoInfo.title.slice(0, 70)}
              </h3>
              <span className="text-gray-500 block mb-2">Time: 33.43</span>
              <div className="flex gap-2">
                <select
                  onChange={(e) => setResu(e.target.value)}
                  className="px-3 py-2 bg-gray-300 border border-blue-500 rounded-md focus:outline-none"
                >
                  {videoInfo.videoResu.length > 0 &&
                    videoInfo.videoResu.map((v, i) => (
                      <option key={i} value={v}>
                        {v}p
                      </option>
                    ))}
                </select>
                <button
                  onClick={videoDownload}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md focus:outline-none"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="text-red-500 mt-4">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Download;
