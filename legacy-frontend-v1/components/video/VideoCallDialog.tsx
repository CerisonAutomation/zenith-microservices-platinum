import { Video, Mic, MicOff, VideoOff, PhoneOff, Maximize, MessageSquare } from "lucide-react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useState } from "react";
import { Card } from "../ui/card";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientPhoto: string;
}

export default function VideoCallDialog({ open, onOpenChange, recipientName, recipientPhoto }: VideoCallDialogProps) {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "ended">("connecting");

  const endCall = () => {
    setCallStatus("ended");
    setTimeout(() => onOpenChange(false), 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] bg-black border-white/10 text-white p-0">
        <div className="relative w-full h-full">
          {/* Main Video */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50 flex items-center justify-center">
            {callStatus === "connecting" ? (
              <div className="text-center">
                <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white/20">
                  <AvatarImage src={recipientPhoto} />
                  <AvatarFallback>{recipientName[0]}</AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-bold mb-2">{recipientName}</h3>
                <p className="text-gray-400 animate-pulse">Connecting...</p>
              </div>
            ) : callStatus === "connected" ? (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <p className="text-gray-400">Video Stream</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl font-bold mb-2">Call Ended</p>
                <p className="text-gray-400">Thanks for connecting!</p>
              </div>
            )}
          </div>

          {/* Self Video (Picture-in-Picture) */}
          {callStatus === "connected" && (
            <Card className="absolute top-4 right-4 w-48 h-36 bg-gray-800 border-white/20 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <p className="text-sm text-gray-400">You</p>
              </div>
            </Card>
          )}

          {/* Call Info */}
          {callStatus === "connected" && (
            <div className="absolute top-4 left-4">
              <Card className="bg-black/60 backdrop-blur-sm border-white/20 px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">00:45</span>
                </div>
              </Card>
            </div>
          )}

          {/* Controls */}
          {callStatus !== "ended" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <Card className="bg-black/80 backdrop-blur-xl border-white/20 p-4">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    className={`rounded-full ${videoEnabled ? "bg-white/10 hover:bg-white/20" : "bg-red-500 hover:bg-red-600"}`}
                  >
                    {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`rounded-full ${audioEnabled ? "bg-white/10 hover:bg-white/20" : "bg-red-500 hover:bg-red-600"}`}
                  >
                    {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </Button>

                  <Button
                    size="icon"
                    onClick={endCall}
                    className="rounded-full bg-red-500 hover:bg-red-600 w-14 h-14"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-white/10 hover:bg-white/20"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-white/10 hover:bg-white/20"
                  >
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
