import cv2
import mediapipe as mp
import numpy as np

def get_mouth_aspect_ratio(landmarks, image_width, image_height):
    """MediaPipeのランドマークから口の縦横比を計算"""
    def get_distance(p1, p2):
        return np.linalg.norm(
            np.array([p1.x * image_width, p1.y * image_height]) -
            np.array([p2.x * image_width, p2.y * image_height])
        )
    
    A = get_distance(landmarks[13], landmarks[14])  # 上唇と下唇
    B = get_distance(landmarks[78], landmarks[308])  # 左右の口角
    return A / B

def get_mouth_center(landmarks, image_width, image_height):
    """口の中心座標を計算"""
    x = (landmarks[13].x + landmarks[14].x) / 2 * image_width
    y = (landmarks[13].y + landmarks[14].y) / 2 * image_height
    return int(x), int(y)

def calculate_time(video_path):
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=10, min_detection_confidence=0.3)
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("Error: The video path is wrong.")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    MAR_THRESHOLD = 0.03
    MIN_ACTIVE_FRAMES = int(fps * 0.4)  # 1秒以上の動きを検出

    active_intervals = []
    active_frames = {}

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (frame.shape[1] // 2, frame.shape[0] // 2))
        current_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if results.multi_face_landmarks:
            for face_id, face_landmarks in enumerate(results.multi_face_landmarks):
                mar = get_mouth_aspect_ratio(face_landmarks.landmark, frame.shape[1], frame.shape[0])
                mouth_center = get_mouth_center(face_landmarks.landmark, frame.shape[1], frame.shape[0])
                
                if face_id not in active_frames:
                    active_frames[face_id] = {'start': None, 'count': 0, 'mouth_position': mouth_center}
                
                if mar > MAR_THRESHOLD:
                    if active_frames[face_id]['start'] is None:
                        active_frames[face_id]['start'] = current_time
                    active_frames[face_id]['count'] += 1
                else:
                    if active_frames[face_id]['start'] is not None and active_frames[face_id]['count'] >= MIN_ACTIVE_FRAMES:
                        active_intervals.append([
                            active_frames[face_id]['start'],
                            current_time,
                            active_frames[face_id]['mouth_position'],
                            face_id
                        ])
                    active_frames[face_id] = {'start': None, 'count': 0, 'mouth_position': mouth_center}

                for idx in [13, 14, 78, 308]:  # 口周辺の主要ランドマーク
                    landmark = face_landmarks.landmark[idx]
                    x = int(landmark.x * frame.shape[1])
                    y = int(landmark.y * frame.shape[0])
                    cv2.circle(frame, (x, y), 2, (0, 255, 0), -1)

                cv2.putText(frame, "Face Detected", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

        cv2.imshow("Mouth Movement Recognition", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    for face_id, data in active_frames.items():
        if data['start'] is not None and data['count'] >= MIN_ACTIVE_FRAMES:
            active_intervals.append([
                data['start'],
                current_time,
                data['mouth_position'],
                face_id
            ])

    cap.release()
    cv2.destroyAllWindows()

    print(active_intervals)

    active_intervals.sort(key=lambda x: x[0])

    print("Mouth movement detected:")
    for interval in active_intervals:
        print(f"Person {interval[3]}: {interval[0]:.2f}秒 ～ {interval[1]:.2f}秒 (位置: {interval[2]})")

    return active_intervals

if __name__ == "__main__":
    calculate_time("./backend/center_video.mp4")
