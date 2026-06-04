import { cloudinary } from './file-uploader.js';

export const cleanupUploadedFileOnFinish = (req, res, next) => {
    if(req.file){
        res.on('finish', async () =>{
            try{
                if(res.statusCode >= 400){
                    const publicId = req.file.public_id || req.file.filename;
                    if(publicId){
                        await cloudinary.uploader.destroy(publicId);
                        console.log(
                            `Archivo eliminado de cloudinary por respuesta: ${res.statusCode}: ${publicId}`
                        );
                    }
                }
            }catch(err){
                console.error(
                    `Error al eliminar el archivo por error en la respuesta ${err.message}`
                );
            }
        })
    }
    next();
}

export const deleteFileOnError = async (err, req, res, next) => {
    try{
        if(req.file){
            const publicId = req.file.public_id || req.file.filename;
            if(publicId){
                await cloudinary.uploader.destroy(publicId);
                console.log(
                    `Archivo eliminado de cloudinary: ${publicId}`
                );
            }
        }
    }catch(e){
        console.error(`Error al eliminar el archivo: ${e.message}`);
    }
    return next(err);
}