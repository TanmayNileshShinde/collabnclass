import { ReactNode } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  children?: ReactNode;
  handleClick?: () => void;
  buttonText?: string;
  instantMeeting?: boolean;
  image?: string;
  buttonClassName?: string;
  buttonIcon?: string;
  isLoading?: boolean;
}

const MeetingModal = ({
  isOpen,
  onClose,
  title,
  className,
  children,
  handleClick,
  buttonText,
  image,
  buttonIcon,
  isLoading = false,
}: MeetingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex w-full max-w-[540px] flex-col gap-8 px-8 py-10 border-0 outline-none"
        style={{
          background: "linear-gradient(160deg, #020f1f 0%, #041a30 50%, #061f3a 100%)",
          border: "1px solid rgba(0,180,255,0.12)",
          boxShadow:
            "0 0 80px rgba(0,80,160,0.3), 0 0 0 1px rgba(0,180,255,0.08), inset 0 1px 0 rgba(0,200,255,0.06)",
          color: "rgba(200,235,255,0.95)",
        }}
      >
        {/* Top edge glow */}
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-xl"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.5), transparent)" }}
        />

        {/* Ambient background orbs */}
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(0,100,200,0.08)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(0,60,140,0.1)" }}
        />

        <div className="flex flex-col gap-8 relative z-10">
          {image && (
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={image}
                  alt="checked"
                  width={80}
                  height={80}
                  className="drop-shadow-2xl relative z-10"
                  style={{ filter: "drop-shadow(0 0 16px rgba(0,220,255,0.4))" }}
                />
                <div
                  className="absolute inset-0 rounded-full blur-2xl animate-pulse"
                  style={{ background: "rgba(0,200,255,0.2)" }}
                />
              </div>
            </div>
          )}

          <h1
            className={cn("text-4xl font-bold leading-[48px] tracking-tight", className)}
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #7dd3fc 50%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(56,189,248,0.3))",
            }}
          >
            {title}
          </h1>

          {children}

          <Button
            onClick={handleClick}
            disabled={isLoading}
            className="font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-300 border-0 relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, rgba(0,80,160,0.9) 0%, rgba(0,120,200,0.9) 50%, rgba(0,160,220,0.9) 100%)",
              border: "1px solid rgba(0,200,255,0.3)",
              boxShadow: "0 0 24px rgba(0,120,200,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
              color: "rgba(220,245,255,0.95)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 40px rgba(0,160,255,0.5), inset 0 1px 0 rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, rgba(0,100,180,0.95) 0%, rgba(0,140,220,0.95) 50%, rgba(0,180,240,0.95) 100%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 24px rgba(0,120,200,0.3), inset 0 1px 0 rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, rgba(0,80,160,0.9) 0%, rgba(0,120,200,0.9) 50%, rgba(0,160,220,0.9) 100%)";
            }}
          >
            {/* Shimmer sweep on hover */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
              }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {buttonIcon && (
                <img
                  src={buttonIcon}
                  alt="button icon"
                  width={16}
                  height={16}
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              )}
              {buttonText || "Schedule Meeting"}
            </span>
          </Button>
        </div>

        {/* Bottom edge glow */}
        <div
          className="absolute inset-x-0 bottom-0 h-px rounded-b-xl"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,120,200,0.3), transparent)" }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;