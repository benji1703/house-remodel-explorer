"""Botanical GLBs using existing Python + NumPy, without bpy.
Y-up metres; no solid proxy foliage. Every leaf grows from a branched shoot.
Olive major wood uses a single fused isosurface. Stage and validate before packing.
"""
from __future__ import annotations
import argparse, json, math, random, struct
from pathlib import Path
import numpy as np
TAU=math.tau

def add(a,b): return tuple(x+y for x,y in zip(a,b))
def sub(a,b): return tuple(x-y for x,y in zip(a,b))
def mul(a,s): return tuple(x*s for x in a)
def dot(a,b): return sum(x*y for x,y in zip(a,b))
def cross(a,b): return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):
    length=math.sqrt(dot(a,a))
    if length<1e-12: raise ValueError('Degenerate direction')
    return mul(a,1/length)
def mix(a,b,t): return add(mul(a,1-t),mul(b,t))
def radial(a,r,y): return (math.cos(a)*r,y,math.sin(a)*r)
def tint(c,f): return tuple(min(.95,x*f) for x in c)
def frame(axis):
    axis=norm(axis)
    ref=min(((1,0,0),(0,1,0),(0,0,1)),key=lambda v:abs(dot(v,axis)))
    u=norm(cross(axis,ref))
    return u,cross(axis,u)
def curve(a,b,bend=(0,.035,0),steps=5):
    return [add(mix(a,b,t/steps),mul(bend,math.sin(math.pi*t/steps))) for t in range(steps+1)]

class Mesh:
    def __init__(self,name,kind):
        self.name,self.kind=name,kind
        self.p,self.n,self.uv,self.c,self.i=[],[],[],[],[]
        self.leaf_count=0
    def vertex(self,p,n,uv,color):
        index=len(self.p)
        self.p.append(p); self.n.append(n); self.uv.append(uv); self.c.append(color)
        return index
    def triangle(self,a,b,c):
        geometric=cross(sub(self.p[b],self.p[a]),sub(self.p[c],self.p[a]))
        if dot(geometric,geometric)<1e-22: raise ValueError(self.name+': zero-area face')
        normal=add(add(self.n[a],self.n[b]),self.n[c])
        if dot(geometric,normal)<0: b,c=c,b
        self.i.extend((a,b,c))
    def tube(self,points,radii,color,sides=5):
        start=len(self.p); distance=0; previous_u=None
        for k,(point,radius) in enumerate(zip(points,radii)):
            axis=norm(sub(points[min(k+1,len(points)-1)],points[max(0,k-1)]))
            if previous_u is None: u,v=frame(axis)
            else:
                u=norm(sub(previous_u,mul(axis,dot(previous_u,axis)))); v=cross(axis,u)
            previous_u=u
            if k: distance+=math.sqrt(dot(sub(point,points[k-1]),sub(point,points[k-1])))
            for j in range(sides+1):
                angle=TAU*j/sides
                normal=add(mul(u,math.cos(angle)),mul(v,math.sin(angle)))
                self.vertex(add(point,mul(normal,radius)),normal,(j/sides,distance*2),color)
        for k in range(len(points)-1):
            for j in range(sides):
                a=start+k*(sides+1)+j; b=a+sides+1
                self.triangle(a,a+1,b+1); self.triangle(a,b+1,b)
        last=len(self.p)-(sides+1)
        cap=self.vertex(points[-1],norm(sub(points[-1],points[-2])),(.5,.5),color)
        for j in range(sides): self.triangle(last+j,last+j+1,cap)
    def leaf(self,origin,direction,length,width,color,roll=0):
        d=norm(direction); side,up=frame(d)
        side,up=add(mul(side,math.cos(roll)),mul(up,math.sin(roll))),add(mul(up,math.cos(roll)),mul(side,-math.sin(roll)))
        # Eight triangles: curved margin, central fold, pointed base and tip.
        points=[origin]; uvs=[(.5,0)]
        for t,breadth in ((.32,.82),(.68,.91)):
            mid=add(add(origin,mul(d,length*t)),mul(up,length*(.09*math.sin(math.pi*t)-.055*t*t)))
            points.extend((add(mid,mul(side,-width*breadth/2)),add(mid,mul(up,width*.13)),add(mid,mul(side,width*breadth/2))))
            uvs.extend(((0,t),(.5,t),(1,t)))
        points.append(add(add(origin,mul(d,length)),mul(up,-length*.055))); uvs.append((.5,1))
        faces=((0,2,1),(0,3,2),(1,2,5),(1,5,4),(2,3,6),(2,6,5),(4,5,7),(5,6,7))
        normals=[(0,0,0) for _ in points]
        for a,b,c in faces:
            n=cross(sub(points[b],points[a]),sub(points[c],points[a]))
            for j in (a,b,c): normals[j]=add(normals[j],n)
        base=len(self.p)
        for j,(point,uv) in enumerate(zip(points,uvs)):
            self.vertex(point,norm(normals[j]),uv,tint(color,.85 if j==0 else 1.04 if j in (2,5) else 1))
        for a,b,c in faces: self.triangle(base+a,base+b,base+c)
        self.leaf_count+=1

def fused_wood(paths,light):
    """Smooth-union tapered capsules, extracted as one continuous wood surface."""
    mesh=Mesh('Olive continuous fluted trunk and branch unions','Bark')
    step=.042 if light else .028
    endpoints=np.array([p for points,radii in paths for p in points])
    lo=endpoints.min(axis=0)-.43; hi=endpoints.max(axis=0)+.43
    axes=[np.arange(lo[i],hi[i]+step,step,dtype=np.float32) for i in range(3)]
    grid=np.stack(np.meshgrid(*axes,indexing='ij'),axis=-1)
    field=np.full(grid.shape[:-1],1e3,dtype=np.float32)
    for points,radii in paths:
        for a,b,ra,rb in zip(points,points[1:],radii,radii[1:]):
            a,b=np.asarray(a),np.asarray(b); axis=b-a
            t=np.clip(np.sum((grid-a)*axis,axis=-1)/np.dot(axis,axis),0,1)
            delta=grid-(a+t[...,None]*axis)
            distance=np.sqrt(np.sum(delta*delta,axis=-1))-(ra+(rb-ra)*t)
            k=.085
            h=np.maximum(k-np.abs(field-distance),0)/k
            field=np.minimum(field,distance)-h*h*k*.25
    angle=np.arctan2(grid[...,2],grid[...,0])
    field+=.009*np.sin(angle*9+grid[...,1]*1.9)*np.exp(-np.maximum(grid[...,1]-.8,0))
    gradients=np.stack(np.gradient(field,step),axis=-1)
    corners=((0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1))
    values=np.stack([field[x:field.shape[0]-1+x,y:field.shape[1]-1+y,z:field.shape[2]-1+z] for x,y,z in corners],axis=-1)
    active=(values.min(axis=-1)<0)&(values.max(axis=-1)>=0); cells=np.argwhere(active)
    positions=np.stack([grid[tuple((cells+corner).T)] for corner in corners],axis=1)
    normals=np.stack([gradients[tuple((cells+corner).T)] for corner in corners],axis=1)
    values=values[active]
    for tetra in ((0,5,1,6),(0,1,2,6),(0,2,3,6),(0,3,7,6),(0,7,4,6),(0,4,5,6)):
        codes=np.sum((values[:,tetra]<0)*np.array([1,2,4,8]),axis=1)
        for code in range(1,15):
            rows=np.flatnonzero(codes==code)
            if not len(rows): continue
            inside=[i for i in range(4) if code&(1<<i)]; outside=[i for i in range(4) if not code&(1<<i)]
            edges=[(a,b) for a in inside for b in outside]; intersections=[]; vertex_normals=[]
            for a,b in edges:
                ia,ib=tetra[a],tetra[b]
                t=values[rows,ia]/(values[rows,ia]-values[rows,ib])
                intersections.append(positions[rows,ia]+t[:,None]*(positions[rows,ib]-positions[rows,ia]))
                ns=normals[rows,ia]+t[:,None]*(normals[rows,ib]-normals[rows,ia])
                vertex_normals.append(ns/np.linalg.norm(ns,axis=1)[:,None])
            faces=((0,1,2),) if len(edges)==3 else ((0,1,3),(0,3,2))
            for row in range(len(rows)):
                base=len(mesh.p)
                for ps,ns in zip(intersections,vertex_normals):
                    p=tuple(float(x) for x in ps[row]); n=tuple(float(x) for x in ns[row])
                    mesh.vertex(p,n,(math.atan2(p[2],p[0])/TAU+.5,p[1]*1.6),(.55,.49,.40))
                for a,b,c in faces:
                    # Isosurface hits on a grid corner can collapse an edge.
                    # Drop only sub-micrometre slivers before export validation.
                    area=cross(sub(mesh.p[base+b],mesh.p[base+a]),sub(mesh.p[base+c],mesh.p[base+a]))
                    if dot(area,area)>1e-22: mesh.triangle(base+a,base+b,base+c)
    return mesh

def olive(light):
    rng=random.Random(73109)
    trunk=[(0,-.14,0),(.055,.20,.02),(-.065,.55,.035),(.055,.95,0),(.12,1.30,-.02)]
    paths=[(trunk,[.34,.30,.24,.20,.14])]
    for a in (.2,1.7,2.9,4.2,5.2):
        paths.append((curve((0,.18,0),radial(a,.58,-.06),(.025,.035,.02),4),[.17,.135,.10,.055,.014]))
    branches=[]
    for j in range(5):
        a=j*2.399+.35; start=trunk[2+j%2]
        end=radial(a,1.06+rng.uniform(-.12,.15),2.3+rng.uniform(-.1,.2))
        points=curve(start,end,radial(a+.5,.13,.13),8)
        paths.append((points,[.17*(1-t/8)**1.2+.018 for t in range(9)])); branches.append((a,points))
    wood=fused_wood(paths,light)
    twigs=Mesh('Olive secondary branches and leafy twigs','Twig')
    leaves=Mesh('Olive paired silver lanceolate leaves','Leaf')
    # Identical seeded skeleton in both LODs; only fine shoots are thinned.
    for branch,(a,points) in enumerate(branches):
        for j in range(18):
            rng=random.Random(1309+branch*103+j); angle=a+(j*2.399)%TAU
            root=points[4+j%5]
            tip=add(points[-1],radial(angle,rng.uniform(.35,.85),rng.uniform(-.20,.62)))
            path=curve(root,tip,(0,.12,0))
            twigs.tube(path,[.018,.015,.011,.007,.004,.0018],(.19,.17,.115),6)
            for k in range(9):
                r=random.Random(5039+branch*1000+j*17+k)
                fork=mix(root,tip,.22+k*.085); angle2=angle+k*2.15
                end=add(fork,radial(angle2,r.uniform(.22,.40),r.uniform(-.08,.18)))
                visible=not light or (j+k)%3!=0
                if visible: twigs.tube(curve(fork,end,(0,.035,0),3),[.0023,.0019,.0013,.00035],(.18,.185,.12),4)
                for n in range(9):
                    p=mix(fork,end,.10+n*.10)
                    for sign in (-1,1):
                        length=r.uniform(.068,.098)*(1.09 if light else 1)
                        color=tint((.19,.235,.135),r.uniform(.60,1.28))
                        if (n+j+k)%5==0: color=tint((.32,.345,.245),r.uniform(.75,1.1))
                        direction=radial(angle2+sign*1.05,1,r.uniform(-.45,.55)); roll=r.uniform(-.6,.6)
                        if visible: leaves.leaf(p,direction,length,.018+length*.06,color,roll)
    return [wood,twigs,leaves]

def shrub(species,light):
    sage=species=='salvia-fruticosa'; myrtle=species=='myrtus-communis'
    height=.73 if sage else 1.03 if myrtle else .72
    reach=.44 if sage else .43 if myrtle else .45
    color=(.255,.315,.21) if sage else (.085,.16,.045) if myrtle else (.12,.205,.085)
    length=.082 if sage else .049 if myrtle else .033
    width=.034 if sage else .021 if myrtle else .004
    wood=Mesh(species+' low branching stems','Twig'); leaves=Mesh(species+' individual foliage','Leaf'); flowers=Mesh(species+' seasonal flowers','Flower')
    for j in range(17):
        rng=random.Random(6309+j*719+(200 if sage else 900 if myrtle else 0))
        a=j*2.399+rng.uniform(-.2,.2)
        basal=radial(a,rng.uniform(.045,.16),.015); shoulder=radial(a,rng.uniform(.14,.29),height*.27)
        wood.tube(curve(basal,shoulder,radial(a+.9,.025,.025),4),[.012,.010,.007,.004,.0025],(.14,.12,.075),6)
        for k in range(9):
            r=random.Random(73109+j*83+k*113+(200 if sage else 900 if myrtle else 0))
            angle=a+r.uniform(-.95,.95); radius=reach*(.30+.70*r.random()**.55)
            end=radial(angle,radius,height*(.80+.18*r.random())*(1-.48*(radius/reach)**2))
            if k<2: end=radial(angle,reach*.25,height*(.87+.10*r.random()))
            root=mix(basal,shoulder,.25+.65*r.random())
            visible=not light or (j+k)%3!=0
            if visible: wood.tube(curve(root,end,radial(angle+.5,.025,.06),5),[.0035,.003,.0024,.0018,.0011,.00035],(.16,.184,.096),4)
            nodes=10 if sage else 13 if myrtle else 19
            for n in range(nodes):
                t=.13+n*.83/(nodes-1)
                p=add(mix(root,end,t),mul(radial(angle+.5,.025,.06),math.sin(math.pi*t)))
                leaf_scale=(.74+.36*r.random())*(1.07 if light else 1)
                for sign in (-1,1):
                    d=radial(angle+sign*(1.02+(n%2)*.37),1,r.uniform(.1,.80))
                    pigment=tint(color,r.uniform(.65,1.22)*(.80+.20*t)); roll=r.uniform(-.6,.6)
                    if visible: leaves.leaf(p,d,length*leaf_scale,width*leaf_scale,pigment,roll)
                    if not sage and not myrtle and visible:
                        leaves.leaf(add(p,(0,.006,0)),radial(angle+sign*1.8,1,.55),length*.8,width*.85,pigment,roll)
            if visible and (j+k)%9==0:
                if myrtle:
                    for petal in range(5): flowers.leaf(end,radial(petal*TAU/5,1,.3),.009,.007,(.68,.64,.48))
                else:
                    for node in range(5):
                        for petal in range(3): flowers.leaf(add(end,(0,node*.013,0)),radial(petal*TAU/3,1,.4),.009,.006,(.29,.22,.38) if sage else (.26,.29,.45))
    return [wood,leaves,flowers]

def write_glb(parts,name,out):
    raw=bytearray(); views=[]; accessors=[]; primitives=[]
    kinds=list(dict.fromkeys(m.kind for m in parts))
    materials=[{'name':kind,'doubleSided':kind in ('Leaf','Flower'),'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.76 if kind=='Leaf' else .92}} for kind in kinds]
    def accessor(data,dtype,type_name,target,bounds=False):
        array=np.asarray(data,dtype=dtype)
        while len(raw)%4: raw.append(0)
        offset=len(raw); raw.extend(array.tobytes())
        view=len(views); views.append({'buffer':0,'byteOffset':offset,'byteLength':array.nbytes,'target':target})
        result={'bufferView':view,'componentType':5126 if dtype=='<f4' else 5125,'count':len(array),'type':type_name}
        if bounds: result.update(min=array.min(axis=0).tolist(),max=array.max(axis=0).tolist())
        accessors.append(result); return len(accessors)-1
    report=[]
    for part in parts:
        if not part.i: continue
        p=np.array(part.p); n=np.array(part.n); idx=np.array(part.i).reshape(-1,3)
        assert np.isfinite(p).all() and np.isfinite(n).all()
        assert np.all(np.abs(np.linalg.norm(n,axis=1)-1)<.001),part.name
        geometric=np.cross(p[idx[:,1]]-p[idx[:,0]],p[idx[:,2]]-p[idx[:,0]])
        assert np.all(np.linalg.norm(geometric,axis=1)>1e-11),part.name
        assert np.all(np.sum(geometric*n[idx].sum(axis=1),axis=1)>0),part.name
        attrs={'POSITION':accessor(part.p,'<f4','VEC3',34962,True),'NORMAL':accessor(part.n,'<f4','VEC3',34962),'TEXCOORD_0':accessor(part.uv,'<f4','VEC2',34962),'COLOR_0':accessor(part.c,'<f4','VEC3',34962)}
        primitives.append({'attributes':attrs,'indices':accessor(part.i,'<u4','SCALAR',34963),'material':kinds.index(part.kind)})
        report.append({'part':part.name,'triangles':len(part.i)//3,'leaves':part.leaf_count,'boundsM':[p.min(axis=0).tolist(),p.max(axis=0).tolist()]})
    doc={'asset':{'version':'2.0','generator':'House botanical authoring v2'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':name}],'meshes':[{'primitives':primitives}],'materials':materials,'buffers':[{'byteLength':len(raw)}],'bufferViews':views,'accessors':accessors}
    js=json.dumps(doc,separators=(',',':')).encode(); js+=b' '*(-len(js)%4); raw+=b'\0'*(-len(raw)%4)
    content=struct.pack('<III',0x46546c67,2,28+len(js)+len(raw))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(raw),b'BIN\0')+raw
    path=out/(name+'.glb'); path.write_bytes(content)
    return {'file':path.name,'bytes':len(content),'triangles':sum(p['triangles'] for p in report),'parts':report}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path('/tmp/house-botanical-v2'))
    parser.add_argument('--species',nargs='+',default=['olea-europaea','salvia-rosmarinus','salvia-fruticosa','myrtus-communis'])
    args=parser.parse_args(); args.output.mkdir(parents=True,exist_ok=True); manifest=[]
    for species in args.species:
        for light in (False,True):
            print('Building',species,'light' if light else 'high',flush=True)
            parts=olive(light) if species=='olea-europaea' else shrub(species,light)
            report=write_glb(parts,species+('-light' if light else ''),args.output)
            manifest.append(report); print(report['file'],report['triangles'],'triangles',report['bytes'],'bytes',flush=True)
    (args.output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
if __name__=='__main__': main()
