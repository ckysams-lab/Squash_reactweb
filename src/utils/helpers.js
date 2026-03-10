// src/utils/helpers.js

export const toDataURL = (url) => {
    return new Promise((resolve) => {
        if (!url || url.startsWith('data:image')) { resolve(url); return; }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
              const dataURL = canvas.toDataURL('image/png');
              resolve(dataURL);
            } catch (e) { console.error("Canvas toDataURL failed:", e); resolve(null); }
        };
        img.onerror = () => { console.error("Image toDataURL failed to load:", url); resolve(null); };
        img.src = url;
    });
};

export const getAcademicYear = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    if (month >= 8) { // Sept (8) to Dec (11)
        return `${year}-${(year + 1).toString().slice(-2)}`;
    } else { // Jan (0) to Aug (7)
        return `${year - 1}-${year.toString().slice(-2)}`;
    }
};

export const readCSVFile = (file, encoding) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target.result;
        const decoder = new TextDecoder(encoding === 'BIG5' ? 'big5' : 'utf-8');
        const text = decoder.decode(new Uint8Array(buffer));
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
};

export const compressImage = (file, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
      };
    });
};

export const getYouTubeEmbedUrl = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};
