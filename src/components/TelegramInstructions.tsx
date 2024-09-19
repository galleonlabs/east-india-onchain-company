import React from "react";

const TelegramInstructions: React.FC = () => {
  return (
    <div className=" p-4  mb-4">
      <h3 className="text-lg mb-2">How to get your Telegram Chat ID:</h3>
      <ol className="list-decimal list-inside">
        <li>
          Start a chat with our bot:{" "}
          <a href="https://t.me/eoic_captain_bot" className="underline underline-offset-2" target="_blank">
            @eoic_captain_bot
          </a>
        </li>
        <li>Send the message "/start" to the bot</li>
        <li>The bot will reply with your Chat ID</li>
        <li>Copy this ID and paste it in the field above</li>
      </ol>
    </div>
  );
};

export default TelegramInstructions;