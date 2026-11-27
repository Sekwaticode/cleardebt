import { twMerge } from "tailwind-merge";
import { HTMLAttributes } from "react";

export default function Tag(props: HTMLAttributes<HTMLDivElement>){
    const {className,children, ...otherProps} = props;
    return (
        <div className={twMerge("inline-flex border border-fuchsia-500 bg-white/60 gap-2 text-fuchsia-600 px-3 py-1 rounded-full uppercase items-center", className)} {...otherProps}>
            <span>&#10038;</span>
            <span>{children}</span>
        </div>
    )
}