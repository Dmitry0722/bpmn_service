// Разрешенные типы файлов
const ALLOWED_TYPES = [
  'text/plain',                    // .txt
  'application/msword',            // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/pdf'                 // .pdf
];

// Максимальный размер файла (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Функция для валидации файла
export const validateFile = (file) => {
  // Проверяем, что файл существует
  if (!file) {
    return {
      isValid: false,
      error: 'Файл не выбран'
    };
  }

  // Проверяем тип файла
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Неподдерживаемый формат файла. Разрешены: TXT, DOC, DOCX, PDF'
    };
  }

  // Проверяем размер файла
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'Файл слишком большой. Максимальный размер: 10 MB'
    };
  }

  // Проверяем, что файл не пустой
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'Файл пустой'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

// Функция для форматирования размера файла
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Функция для получения расширения файла
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
};

// Функция для чтения текстового файла (для предпросмотра)
export const readTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file);
  });
};