#!/usr/bin/env python3
"""Check static routes, anchors, media, prices and contact URLs; stdlib only."""
import json,re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,parse_qs,unquote
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.refs=[];self.ids=set();self.h1=0;self.redirect=False;self.lang=None;self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='html':self.lang=a.get('lang')
  if tag=='h1':self.h1+=1
  if 'id'in a:self.ids.add(a['id'])
  for key in ('href','src'):
   if key in a:self.refs.append((tag,a[key]))
  if tag=='meta' and a.get('http-equiv')=='refresh':self.redirect=True
pages={p:Page(p.read_text()) for p in [*ROOT.glob('*.html'),*(ROOT/'en').glob('*.html')]}
errors=[];contacts=0;images=set()
for path,doc in pages.items():
 if not doc.redirect and doc.h1!=1:errors.append(f'{path.name}: expected one h1')
 if doc.lang!=('en' if path.parent.name=='en' else 'ru'):errors.append(f'{path}: incorrect language')
 for tag,ref in doc.refs:
  u=urlsplit(ref)
  if u.netloc=='wa.me':
   contacts+=1
   if u.path!='/79054076340' or not parse_qs(u.query).get('text'):errors.append(f'{path}: incorrect WhatsApp URL')
  if u.scheme=='mailto':
   contacts+=1
   if u.path!='sherxanova@gmail.com' or not parse_qs(u.query).get('subject'):errors.append(f'{path}: incorrect email URL')
  if u.scheme or u.netloc:continue
  target=(path.parent/unquote(u.path)).resolve() if u.path else path
  if not target.is_relative_to(ROOT):errors.append(f'{path}: escapes site root {ref}');continue
  if not target.exists():errors.append(f'{path}: missing {ref}');continue
  if u.fragment and target.suffix=='.html' and target in pages and u.fragment not in pages[target].ids:errors.append(f'{path}: missing anchor {ref}')
  if tag=='img':images.add(target)
 for term in ['Калейдоскоп','калейдоскоп','TETOptt','22 pages of sales']:
  if term in path.read_text():errors.append(f'{path}: unexpected content {term}')
for p in [ROOT/'price.html',ROOT/'en/price.html']:
 text=p.read_text()
 if text.count('class="price-item"')!=6:errors.append(f'{p}: expected six prices')
 for s in json.loads((ROOT/'data/services.json').read_text())['services']:
  if f'id="{s["id"]}"' not in text:errors.append(f'{p}: missing service {s["id"]}')
for p in [ROOT/'studio.css']:
 for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)',p.read_text()):
  if not (p.parent/ref).exists():errors.append(f'{p}: missing font {ref}')
assert not errors,'\n'.join(errors)
print(f'PASS: {len(pages)} HTML routes; local links/anchors; {len(images)} referenced images; {contacts} contact links; six services in both languages; local fonts.')
