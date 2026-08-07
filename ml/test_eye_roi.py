from PIL import Image
from anemia.eye_roi import crop_eye_roi

img_path = "data/sewa/restored/00047e5d-eacd-4b17-8575-39e4181ca498/Media/Anemia_Conjunctiva/Participant00047e5d-eacd-4b17-8575-39e4181ca498_Anemia_Conjunctiva_0_v2s1.jpeg"
out_path = "/Users/gurleenkaurbedi/.gemini/antigravity-ide/brain/c4790e37-e158-43cf-9b86-70d212c8532f/eye_crop_test.jpeg"

img = Image.open(img_path)
cropped = crop_eye_roi(img)
cropped.save(out_path)
print(f"Saved to {out_path}")
