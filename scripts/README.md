# Import Objects from Folder Script

폴더 구조에서 오브젝트를 일괄 생성하는 스크립트입니다.

## 사용 방법

```bash
npm run import:objects <folder-path>
```

또는

```bash
npx ts-node --transpile-only scripts/import-objects-from-folder.ts <folder-path>
```

## 폴더 구조 규칙

### 폴더명 형식
```
{name}-{description}-{onType}
```

설명이 없으면:
```
{name}--{onType}
```

**예시:**
- `chair-의자-Floor` → name: "chair", description: "의자", onType: "Floor"
- `picture--LeftWall` → name: "picture", description: undefined, onType: "LeftWall"
- `table-나무테이블-RightWall` → name: "table", description: "나무테이블", onType: "RightWall"

### 이미지 파일명 형식
```
{name}-{color}.png
```

**예시:**
- `red-#FF0000.png` → name: "red", color: "#FF0000"
- `blue-#0000FF.png` → name: "blue", color: "#0000FF"
- `wood-#8B4513.png` → name: "wood", color: "#8B4513"

## 폴더 구조 예시

```
objects/
├── chair-의자-Floor/
│   ├── red-#FF0000.png
│   ├── blue-#0000FF.png
│   └── wood-#8B4513.png
├── picture--LeftWall/
│   ├── frame1-#FFFFFF.png
│   └── frame2-#000000.png
└── table-나무테이블-RightWall/
    ├── oak-#D2B48C.png
    └── pine-#F5DEB3.png
```

## 사용 예시

```bash
# ZIP 파일을 압축 해제한 폴더 경로 지정
npm run import:objects ./extracted-objects

# 또는 절대 경로
npm run import:objects /path/to/objects
```

## 주의사항

1. **환경 변수**: `.env` 파일에 `MONGODB_URI`와 스토리지 설정이 필요합니다.
2. **이미지 파일**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` 확장자만 지원합니다.
3. **onType 값**: `LeftWall`, `RightWall`, `Floor` 중 하나여야 합니다.
4. **중복**: 같은 이름의 오브젝트가 이미 있으면 새로 생성됩니다 (중복 체크 없음).

## 필요한 패키지

`ts-node`가 필요할 수 있습니다. 설치되지 않은 경우:

```bash
npm install --save-dev ts-node
```

