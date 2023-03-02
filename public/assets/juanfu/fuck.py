import re
import numpy as np
import os
import glob
import cv2
import shutil
import subprocess
import tqdm
import multiprocessing
from icecream import ic

a = cv2.imread("general_roughness.png", cv2.IMREAD_GRAYSCALE)
b = cv2.imread("general_ao.png", cv2.IMREAD_GRAYSCALE)
c = cv2.imread("general_thickness.png", cv2.IMREAD_GRAYSCALE)

rat = np.stack([a, b, c], axis=2)

cv2.imwrite("rat.png", rat[:, :, ::-1])
