# cloudinary_config.py
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
import os

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_image(file_bytes, folder="zavara"):
    """Upload image to Cloudinary"""
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            transformation=[
                {
                    'width': 800,
                    'height': 800,
                    'crop': 'limit',
                    'quality': 'auto',
                    'fetch_format': 'auto'
                }
            ]
        )
        return {
            "success": True,
            "url": result['secure_url'],
            "public_id": result['public_id']
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def upload_product_image(file_bytes):
    return upload_image(file_bytes, folder="zavara/products")

def upload_restaurant_image(file_bytes):
    return upload_image(file_bytes, folder="zavara/restaurants")

def upload_profile_image(file_bytes):
    return upload_image(
        file_bytes,
        folder="zavara/profiles"
    )

def upload_document(file_bytes):
    return upload_image(
        file_bytes,
        folder="zavara/documents"
    )

def delete_image(public_id):
    """Delete image from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}