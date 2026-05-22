import type { Clip } from "../types";
import ClipItem from "./ClipItem";
import styles from "./ClipList.module.css";

interface ClipListProps {
  clips: Clip[];
  onCopy: (c: Clip) => void;
  onPin: (c: Clip) => void;
  onDelete: (c: Clip) => void;
}

export default function ClipList({ clips, onCopy, onPin, onDelete }: ClipListProps) {
  return (
    <div className={styles.list}>
      {clips.map((c, i) => (
        <ClipItem
          key={c.id}
          clip={c}
          index={i}
          onCopy={onCopy}
          onPin={onPin}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
