import { twMerge } from "tailwind-merge";

export default function Pointer(props: {
    name: string;
    color?: "red" | "blue";
}) {
    const { name, color } = props;
    return (
        <div className="relative">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white size-5"
            >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
            </svg>
            <div className="absolute top-full left-full">
                <div
                    className={twMerge(
                        "inline flex rounded-full font-bold text-sm bg-blue-500 px-2 rounded-tl-none",
                        color === "red" && "bg-red-500",
                    )}
                >
                    {name}
                </div>
            </div>
        </div>
    );
}
