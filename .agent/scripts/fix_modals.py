import os
import re

files = [
    r"c:\Users\Dell\OneDrive\Desktop\Projects\portfolio\TD\app\(tabs)\expenses.tsx",
    r"c:\Users\Dell\OneDrive\Desktop\Projects\portfolio\TD\app\(tabs)\products.tsx",
    r"c:\Users\Dell\OneDrive\Desktop\Projects\portfolio\TD\app\(tabs)\stats.tsx",
    r"c:\Users\Dell\OneDrive\Desktop\Projects\portfolio\TD\app\(tabs)\utang.tsx",
    r"c:\Users\Dell\OneDrive\Desktop\Projects\portfolio\TD\app\product\[id].tsx",
    r"c:\Users\Dell\OneDrive\Desktop\Projects\portfolio\TD\app\transaction\[id].tsx",
    r"c:\Users\Dell\OneDrive\Desktop\Projects\portfolio\TD\app\(tabs)\sell.tsx",
]

alert_overlay_style = """  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },"""

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Step 1: Add alertOverlay to StyleSheet
    if "alertOverlay:" not in content:
        content = content.replace("modalOverlay: {", alert_overlay_style + "\n  modalOverlay: {")

    # Step 2: Replace modalOverlay with alertOverlay specifically for the alert modal
    # The alert modal structure is usually:
    # <Modal visible={alertVisible} ...>
    #   <View style={styles.modalOverlay}>
    #     <BlurView ... />
    #     <View style={styles.alertCard}> OR <Animated.View ... style={styles.alertCard}>
    
    # We will use regex to find <View style={styles.modalOverlay}> followed by BlurView and alertCard, 
    # and replace just that View's style.
    
    pattern = r'(<View style=\{)styles\.modalOverlay(\}>[\s\n]*<BlurView)'
    content = re.sub(pattern, r'\1styles.alertOverlay\2', content)

    # Some files might have ZoomIn for alertCard instead of BlurView directly following, 
    # Let's use a more robust replacement for the Modal visible={alertVisible} block.
    # Actually, all custom alerts use BlurView. Let's check if the pattern matched.
    if 'styles.alertOverlay' not in content:
        print(f"Warning: alertOverlay not used in {file}")

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done applying alertOverlay.")
