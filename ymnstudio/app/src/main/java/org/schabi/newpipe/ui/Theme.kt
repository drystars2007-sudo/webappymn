package org.schabi.newpipe.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import org.schabi.newpipe.model.ThemeMode

private val LightColors = lightColorScheme(
    primary = Color(0xFFE53935),
    onPrimary = Color.White,
    background = Color(0xFFEEEEEE),
    onBackground = Color(0xFF1A1A1A),
    surface = Color(0xFFF8F8F8),
    onSurface = Color(0xFF1A1A1A),
    surfaceVariant = Color(0xFFE9E9E9),
    onSurfaceVariant = Color(0xFF5E5E5E)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFFF5252),
    onPrimary = Color.White,
    background = Color(0xFF222222),
    onBackground = Color(0xFFF5F5F5),
    surface = Color(0xFF313131),
    onSurface = Color(0xFFF5F5F5),
    surfaceVariant = Color(0xFF474747),
    onSurfaceVariant = Color(0xFFB0B0B0)
)

private val BlackColors = darkColorScheme(
    primary = Color(0xFFFF5252),
    onPrimary = Color.White,
    background = Color(0xFF000000),
    onBackground = Color.White,
    surface = Color(0xFF0F0F0F),
    onSurface = Color.White,
    surfaceVariant = Color(0xFF202020),
    onSurfaceVariant = Color(0xFF9E9E9E)
)

@Composable
fun YmnTubeTheme(mode: ThemeMode, content: @Composable () -> Unit) {
    val colors = when (mode) {
        ThemeMode.LIGHT -> LightColors
        ThemeMode.DARK -> DarkColors
        ThemeMode.BLACK -> BlackColors
    }
    MaterialTheme(colorScheme = colors, content = content)
}
