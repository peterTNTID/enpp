
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Colors
  static const Color primaryText = Color(0xFF2B2B2B);
  static const Color background = Color(0xFFFDFDFD);
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color accent = Color(0xFFD4A373);
  static const Color secondaryAccent = Color(0xFF8D99AE);
  static const Color error = Color(0xFFE63946);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      primaryColor: accent,
      
      // Typography
      textTheme: TextTheme(
        displayLarge: GoogleFonts.outfit(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: primaryText,
        ),
        displayMedium: GoogleFonts.outfit(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: primaryText,
        ),
        bodyLarge: GoogleFonts.mulish(
          fontSize: 16,
          color: primaryText,
        ),
        bodyMedium: GoogleFonts.mulish(
          fontSize: 14,
          color: primaryText.withValues(alpha: 0.8),
        ),
        labelLarge: GoogleFonts.outfit(
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),

      // App Bar Theme
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.outfit(
          color: primaryText,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: const IconThemeData(color: primaryText),
      ),

      // Card Theme
      cardTheme: CardTheme(
        color: cardBackground,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.grey.withValues(alpha: 0.1)),
        ),
      ),
      
      // Chip Theme
      chipTheme: ChipThemeData(
        backgroundColor: Colors.transparent,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: const BorderSide(color: secondaryAccent)
        ),
        labelStyle: GoogleFonts.mulish(color: primaryText),
        selectedColor: accent.withValues(alpha: 0.2),
        secondarySelectedColor: accent,
      ),
    );
  }
}
