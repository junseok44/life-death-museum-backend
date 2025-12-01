import dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import * as path from "path";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { connectDatabase } from "../src/config/database";
import { ImageObject, OnType } from "../src/models/ObjectModel";
import { storage } from "../src/services/storage";

/**
 * 폴더명 파싱: name-description-onType 또는 name--onType
 * 예: "chair-의자-Floor" → { name: "chair", description: "의자", onType: "Floor" }
 * 예: "picture--LeftWall" → { name: "picture", description: undefined, onType: "LeftWall" }
 */
function parseFolderName(folderName: string): {
  name: string;
  description?: string;
  onType: OnType;
} {
  const parts = folderName.split("-");

  // name--onType 형식 (설명 없음)
  if (parts.length === 3 && parts[1] === "") {
    const name = parts[0];
    const onTypeStr = parts[2];

    if (!Object.values(OnType).includes(onTypeStr as OnType)) {
      throw new Error(
        `Invalid onType: ${onTypeStr}. Must be one of: ${Object.values(OnType).join(", ")}`
      );
    }

    return {
      name,
      description: undefined,
      onType: onTypeStr as OnType,
    };
  }

  // name-description-onType 형식
  if (parts.length >= 3) {
    const name = parts[0];
    const onTypeStr = parts[parts.length - 1];
    const description = parts.slice(1, -1).join("-"); // 중간 부분들을 모두 합침

    if (!Object.values(OnType).includes(onTypeStr as OnType)) {
      throw new Error(
        `Invalid onType: ${onTypeStr}. Must be one of: ${Object.values(OnType).join(", ")}`
      );
    }

    return {
      name,
      description: description || undefined,
      onType: onTypeStr as OnType,
    };
  }

  throw new Error(
    `Invalid folder name format: ${folderName}. Expected: name-description-onType or name--onType`
  );
}

/**
 * 이미지 파일명 파싱: name-color.png
 * 예: "red-#FF0000.png" → { name: "red", color: "#FF0000" }
 */
function parseImageFileName(fileName: string): {
  name: string;
  color: string;
} {
  const nameWithoutExt = path.basename(fileName, path.extname(fileName));
  const parts = nameWithoutExt.split("-");

  if (parts.length < 2) {
    throw new Error(
      `Invalid image file name format: ${fileName}. Expected: name-color.png`
    );
  }

  const name = parts[0];
  const color = parts.slice(1).join("-"); // color에 하이픈이 포함될 수 있음 (예: #FF-00-00)

  // color가 hex 코드 형식인지 검증
  // #으로 시작하고, 그 뒤에 정확히 6자리 hex 코드 (#RRGGBB) 또는 3자리 short hex (#RGB)
  const hexPattern = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
  if (!hexPattern.test(color)) {
    throw new Error(
      `Invalid hex color format: "${color}" in file "${fileName}". Expected format: #RRGGBB or #RGB (e.g., #FF0000 or #F00)`
    );
  }

  // 3자리 short hex를 6자리로 확장 (선택적)
  let normalizedColor = color;
  if (color.length === 4) {
    // #RGB → #RRGGBB
    normalizedColor =
      `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  }

  return {
    name,
    color: normalizedColor,
  };
}

/**
 * 이미지 파일 확장자 확인
 */
function isImageFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext);
}

/**
 * 폴더 검증 (오브젝트 생성 전)
 */
function validateFolder(
  folderPath: string,
  folderName: string
): {
  name: string;
  description?: string;
  onType: OnType;
  imageFiles: string[];
} {
  // 폴더명 파싱
  const { name, description, onType } = parseFolderName(folderName);

  // 폴더 내 파일 목록 읽기
  const files = fs.readdirSync(folderPath);
  const imageFiles = files.filter((file) => {
    const filePath = path.join(folderPath, file);
    return fs.statSync(filePath).isFile() && isImageFile(file);
  });

  // 최소 하나의 imageSet이 있어야 함
  if (imageFiles.length === 0) {
    throw new Error(
      `No image files found in folder "${folderName}". At least one image file is required.`
    );
  }

  // 모든 이미지 파일명 검증
  for (const imageFile of imageFiles) {
    try {
      parseImageFileName(imageFile);
    } catch (error) {
      throw new Error(
        `Invalid image file name in folder "${folderName}": ${imageFile}. ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    name,
    description,
    onType,
    imageFiles,
  };
}

/**
 * 폴더에서 오브젝트 생성
 */
async function createObjectFromFolder(
  folderPath: string,
  folderName: string,
  validatedData: {
    name: string;
    description?: string;
    onType: OnType;
    imageFiles: string[];
  }
): Promise<void> {
  const { name, description, onType, imageFiles } = validatedData;

  console.log(`\n📁 Creating object from folder: ${folderName}`);
  console.log(`   Name: ${name}`);
  console.log(`   Description: ${description || "(none)"}`);
  console.log(`   OnType: ${onType}`);
  console.log(`   Image files: ${imageFiles.length}`);

  // 랜덤 문자열로 고유성 보장 (같은 오브젝트의 파일들은 공통 prefix 사용)
  const randomPrefix = randomBytes(8).toString("hex"); // 16자리 hex 문자열

  // 각 이미지 파일 처리 및 업로드
  const imageSets = await Promise.all(
    imageFiles.map(async (imageFile, index) => {
      const { name: imageSetName, color } = parseImageFileName(imageFile);
      const imagePath = path.join(folderPath, imageFile);

      // 파일 읽기
      const fileBuffer = fs.readFileSync(imagePath);
      const mimeType = `image/${path.extname(imageFile).slice(1).toLowerCase()}`;

      // Storage에 업로드 (파일명: randomPrefix-index)
      const uploadPath = `presets/${randomPrefix}-${index}${path.extname(imageFile)}`;
      const imageUrl = await storage.uploadFromBuffer(
        fileBuffer,
        uploadPath,
        mimeType
      );

      console.log(`   ✓ Uploaded: ${imageFile} → ${imageSetName} (${color})`);

      return {
        name: imageSetName,
        color,
        src: imageUrl,
      };
    })
  );

  // 첫 번째 이미지를 currentImageSet으로 사용
  const currentImageSet = imageSets[0];

  // 오브젝트 생성
  const newObject = new ImageObject({
    name: name.trim(),
    currentImageSet,
    description: description?.trim(),
    imageSets,
    isUserMade: false,
    onType,
  });

  const savedObject = await newObject.save();
  console.log(`   ✅ Created object: ${savedObject._id} (${savedObject.name})`);
}

/**
 * 메인 함수
 */
async function main() {
  const folderPath = process.argv[2];

  if (!folderPath) {
    console.error(
      "Usage: ts-node scripts/import-objects-from-folder.ts <folder-path>"
    );
    console.error(
      "Example: ts-node scripts/import-objects-from-folder.ts ./objects"
    );
    process.exit(1);
  }

  if (!fs.existsSync(folderPath)) {
    console.error(`Error: Folder does not exist: ${folderPath}`);
    process.exit(1);
  }

  if (!fs.statSync(folderPath).isDirectory()) {
    console.error(`Error: Path is not a directory: ${folderPath}`);
    process.exit(1);
  }

  try {
    // 데이터베이스 연결
    console.log("🔌 Connecting to database...");
    await connectDatabase();

    // 폴더 내 모든 하위 폴더 찾기
    const entries = fs.readdirSync(folderPath);
    const folders = entries.filter((entry) => {
      const entryPath = path.join(folderPath, entry);
      return fs.statSync(entryPath).isDirectory();
    });

    if (folders.length === 0) {
      console.warn("⚠️  No subfolders found in the specified path");
      process.exit(0);
    }

    console.log(`\n📦 Found ${folders.length} folder(s) to process\n`);

    // 1단계: 모든 폴더 검증
    console.log("🔍 Step 1: Validating all folders...\n");
    const validatedFolders: Array<{
      folderPath: string;
      folderName: string;
      validatedData: {
        name: string;
        description?: string;
        onType: OnType;
        imageFiles: string[];
      };
    }> = [];

    for (const folder of folders) {
      const folderPathFull = path.join(folderPath, folder);
      try {
        console.log(`   ✓ Validating: ${folder}`);
        const validatedData = validateFolder(folderPathFull, folder);
        validatedFolders.push({
          folderPath: folderPathFull,
          folderName: folder,
          validatedData,
        });
      } catch (error) {
        console.error(`\n❌ Validation failed for folder "${folder}":`);
        console.error(
          `   ${error instanceof Error ? error.message : String(error)}`
        );
        throw new Error(
          `Validation failed. Please fix the errors above before proceeding.`
        );
      }
    }

    console.log(
      `\n✅ All ${validatedFolders.length} folder(s) passed validation\n`
    );

    // 2단계: 검증 통과한 폴더들로 오브젝트 생성
    console.log("📝 Step 2: Creating objects...\n");
    for (const { folderPath, folderName, validatedData } of validatedFolders) {
      try {
        await createObjectFromFolder(folderPath, folderName, validatedData);
      } catch (error) {
        console.error(
          `\n❌ Error creating object from folder "${folderName}":`
        );
        console.error(
          `   ${error instanceof Error ? error.message : String(error)}`
        );
        throw error;
      }
    }

    console.log(
      `\n✅ Successfully processed ${validatedFolders.length} folder(s)`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// 스크립트 실행
main();
