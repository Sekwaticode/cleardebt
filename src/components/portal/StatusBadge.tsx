import { STATUS_LABELS, isStatus } from "@/lib/forms/definitions";

export default function StatusBadge({ status }: { status: string }) {
    const known = isStatus(status);
    return <span className={`cd-badge ${known ? status : "draft"}`}>{known ? STATUS_LABELS[status] : status}</span>;
}
