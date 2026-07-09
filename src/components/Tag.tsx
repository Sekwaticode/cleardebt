import { twMerge } from "tailwind-merge";
import { HTMLAttributes } from "react";

export default function Tag(props: HTMLAttributes<HTMLDivElement>){
    const {className,children, ...otherProps} = props;
    return (
        <div className={twMerge("inline-flex border border-fuchsia-400 gap-2 text-fuchsia-400 px-3 py-1 rounded-full uppercase items-center", className)} {...otherProps}>
            <span>&#10038;</span>
            <span>{children}</span>
        </div>
    )
}