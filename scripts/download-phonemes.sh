#!/bin/bash
# Download standard phoneme audio from yingyuyinbiao.com
DIR="C:/Users/liuke/Desktop/turing-complete-phonics/public/assets/audio/standard"
BASE="https://yingyuyinbiao.com/wp-content/uploads"

# Consonants 2020/08-10
curl -sL -o "$DIR/b.mp3" "$BASE/2020/08/b_sound.mp3" &
curl -sL -o "$DIR/p.mp3" "$BASE/2020/08/p_sound.mp3" &
curl -sL -o "$DIR/e.mp3" "$BASE/2020/08/e.mp3" &
curl -sL -o "$DIR/a_long.mp3" "$BASE/2020/08/a-long.mp3" &
curl -sL -o "$DIR/ai.mp3" "$BASE/2020/08/ai.mp3" &
curl -sL -o "$DIR/i.mp3" "$BASE/2020/08/I.mp3" &
curl -sL -o "$DIR/i_long.mp3" "$BASE/2020/08/I-long.mp3" &
curl -sL -o "$DIR/u_long.mp3" "$BASE/2020/08/u-long.mp3" &

curl -sL -o "$DIR/d.mp3" "$BASE/2020/09/d_sound.mp3" &
curl -sL -o "$DIR/dr.mp3" "$BASE/2020/09/dr.mp3" &
curl -sL -o "$DIR/dz.mp3" "$BASE/2020/09/dz.mp3" &
curl -sL -o "$DIR/f.mp3" "$BASE/2020/09/f_sound.mp3" &
curl -sL -o "$DIR/g.mp3" "$BASE/2020/09/g_sound.mp3" &
curl -sL -o "$DIR/k.mp3" "$BASE/2020/09/k_sound.mp3" &
curl -sL -o "$DIR/s.mp3" "$BASE/2020/09/s_sound.mp3" &
curl -sL -o "$DIR/t.mp3" "$BASE/2020/09/t_sound.mp3" &
curl -sL -o "$DIR/tr.mp3" "$BASE/2020/09/tr.mp3" &
curl -sL -o "$DIR/ts.mp3" "$BASE/2020/09/ts.mp3" &
curl -sL -o "$DIR/v.mp3" "$BASE/2020/09/v_sound.mp3" &
curl -sL -o "$DIR/z.mp3" "$BASE/2020/09/z_sound.mp3" &
curl -sL -o "$DIR/dzh.mp3" "$BASE/2020/09/%CA%A4-j_sound.mp3" &
curl -sL -o "$DIR/tsh.mp3" "$BASE/2020/09/%CA%A7-ch_sound.mp3" &

curl -sL -o "$DIR/h.mp3" "$BASE/2020/10/h.mp3" &
curl -sL -o "$DIR/j_yet.mp3" "$BASE/2020/10/j-yet-use.mp3" &
curl -sL -o "$DIR/l.mp3" "$BASE/2020/10/l.mp3" &
curl -sL -o "$DIR/m.mp3" "$BASE/2020/10/m.mp3" &
curl -sL -o "$DIR/n.mp3" "$BASE/2020/10/n.mp3" &
curl -sL -o "$DIR/r.mp3" "$BASE/2020/10/r.mp3" &
curl -sL -o "$DIR/w.mp3" "$BASE/2020/10/w-wet-vet.mp3" &
curl -sL -o "$DIR/ng.mp3" "$BASE/2020/10/%C5%8B.mp3" &

# Vowels 2021/01
curl -sL -o "$DIR/au.mp3" "$BASE/2021/01/a%CA%8A.mp3" &
curl -sL -o "$DIR/ea.mp3" "$BASE/2021/01/e%C9%99.mp3" &
curl -sL -o "$DIR/ei.mp3" "$BASE/2021/01/e%C9%AA.mp3" &
curl -sL -o "$DIR/ae.mp3" "$BASE/2021/01/%C3%A6.mp3" &
curl -sL -o "$DIR/voiced_th.mp3" "$BASE/2021/01/%C3%B0-voiced_th.mp3" &
curl -sL -o "$DIR/o_short.mp3" "$BASE/2021/01/%C9%92.mp3" &
curl -sL -o "$DIR/o_long.mp3" "$BASE/2021/01/%C9%94-long.mp3" &
curl -sL -o "$DIR/oi.mp3" "$BASE/2021/01/%C9%94%C9%AA.mp3" &
curl -sL -o "$DIR/schwa_long.mp3" "$BASE/2021/01/%C9%99-long.mp3" &
curl -sL -o "$DIR/schwa.mp3" "$BASE/2021/01/%C9%99.mp3" &
curl -sL -o "$DIR/ou.mp3" "$BASE/2021/01/%C9%99U.mp3" &
curl -sL -o "$DIR/ia.mp3" "$BASE/2021/01/%C9%AA%C9%99.mp3" &
curl -sL -o "$DIR/u_short.mp3" "$BASE/2021/01/%CA%8A.mp3" &
curl -sL -o "$DIR/ua.mp3" "$BASE/2021/01/%CA%8A%C9%99.mp3" &
curl -sL -o "$DIR/u_turn.mp3" "$BASE/2021/01/%CA%8C.mp3" &
curl -sL -o "$DIR/unvoiced_th.mp3" "$BASE/2021/01/%CE%B8-unvoiced_th.mp3" &

curl -sL -o "$DIR/sh.mp3" "$BASE/2021/10/%CA%83-sh_sound.mp3" &
curl -sL -o "$DIR/zh.mp3" "$BASE/2021/12/%CA%92-zh_sound.mp3" &

wait
echo "Download complete!"
ls "$DIR" | wc -l
ls -la "$DIR/"
