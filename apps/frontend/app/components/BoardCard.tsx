"use client"

import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material"
import { useState } from "react"
import Link from "next/link"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import PeopleIcon from "@mui/icons-material/People"
import ListIcon from "@mui/icons-material/List"
import LockIcon from "@mui/icons-material/Lock"
import PublicIcon from "@mui/icons-material/Public"
import type { Board } from "@/lib/api"

interface BoardCardProps {
  board: Board
  onEdit?: () => void
  onDelete?: () => void
}

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleEdit = () => {
    handleMenuClose()
    onEdit?.()
  }

  const handleDelete = () => {
    handleMenuClose()
    onDelete?.()
  }

  return (
    <Card
      component={Link}
      href={`/board/${board.id}`}
      sx={{
        height: 200,
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 3,
        },
        position: "relative",
      }}
    >
      {board.backgroundUrl ? (
        <CardMedia
          component="div"
          sx={{
            height: 120,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${board.backgroundUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
              {board.title}
            </Typography>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ color: "white" }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {board.isPrivate ? (
              <LockIcon sx={{ color: "white", fontSize: 16 }} />
            ) : (
              <PublicIcon sx={{ color: "white", fontSize: 16 }} />
            )}
            <Typography variant="body2" sx={{ color: "white" }}>
              {board.isPrivate ? "Private" : "Public"}
            </Typography>
          </Box>
        </CardMedia>
      ) : (
        <Box
          sx={{
            height: 120,
            bgcolor: "primary.main",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
              {board.title}
            </Typography>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ color: "white" }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {board.isPrivate ? (
              <LockIcon sx={{ color: "white", fontSize: 16 }} />
            ) : (
              <PublicIcon sx={{ color: "white", fontSize: 16 }} />
            )}
            <Typography variant="body2" sx={{ color: "white" }}>
              {board.isPrivate ? "Private" : "Public"}
            </Typography>
          </Box>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {board.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {board.description}
          </Typography>
        )}
        
        <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
          {board.memberCount !== undefined && (
            <Chip
              icon={<PeopleIcon />}
              label={board.memberCount}
              size="small"
              variant="outlined"
            />
          )}
          {board.listCount !== undefined && (
            <Chip
              icon={<ListIcon />}
              label={board.listCount}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Edit Board</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          Delete Board
        </MenuItem>
      </Menu>
    </Card>
  )
}